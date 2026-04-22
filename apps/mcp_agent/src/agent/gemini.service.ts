import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Database schema reference passed to Gemini so it can construct
 * intelligent queries for any question about housing data.
 */
const DATABASE_SCHEMA = `
DATABASE SCHEMA (PostgreSQL via Prisma):

MODEL: User
  userId (Int, PK), utaId (String), netId (String), fName (String), mName (String?),
  lName (String), email (String), phone (BigInt?), dob (DateTime?), gender (MALE|FEMALE|OTHER),
  role (STUDENT|STAFF|ADMIN|DRAFT), studentStatus (APPLICANT|RESIDENT),
  staffPosition (MANAGEMENT|RESIDENT_A|MAINTENANCE), assignedPropertyId (Int?),
  requiresAdaAccess (Boolean), isLocked (Boolean), createdAt, updatedAt
  Relations: applications[], leases[], occupancies[], maintenanceCreated[], maintenanceAssigned[]

MODEL: Property
  propertyId (Int, PK), name (String), address (String?),
  propertyType (RESIDENCE_HALL|APARTMENT), leaseType (BY_UNIT|BY_ROOM|BY_BED),
  phone (BigInt?), baseRate (Decimal?), totalCapacity (Int?), createdAt
  Relations: units[], assignedStaff[], applicants[]

MODEL: Unit
  unitId (Int, PK), propertyId (Int, FK->Property), unitNumber (String),
  floorLevel (Int?), requiresAdaAccess (Boolean), maxOccupancy (Int?)
  Relations: property, rooms[], leases[]

MODEL: Room
  roomId (Int, PK), unitId (Int, FK->Unit), roomLetter (String)
  Relations: unit, beds[], leases[]

MODEL: Bed
  bedId (Int, PK), roomId (Int, FK->Room), bedLetter (String)
  Relations: room, leases[]

MODEL: Application
  appId (Int, PK), userId (Int, FK->User), term (String),
  status (DRAFT|SUBMITTED|UNDER_REVIEW|APPROVED|REJECTED|CANCELLED),
  preferredPropertyId (Int?, FK->Property), submissionDate (DateTime?),
  cleanliness, dietaryRestrictions, emergencyContactName, emergencyContactPhone,
  emergencyContactRelation, noiseLevel, sleepSchedule, smokingPreference,
  specialAccommodations, idCardUrl, createdAt, updatedAt
  Relations: user, preferredProperty

MODEL: Lease
  leaseId (Int, PK), userId (Int, FK->User), leaseType (BY_UNIT|BY_ROOM|BY_BED),
  assignedUnitId (Int?), assignedRoomId (Int?), assignedBedId (Int?),
  startDate (DateTime), endDate (DateTime), totalDue (Decimal), dueThisMonth (Decimal),
  status (DRAFT|PENDING_SIGNATURE|SIGNED|ACTIVE|COMPLETED|TERMINATED|TERMINATION_REQUESTED),
  signedAt, terminationFee (Decimal?), terminationReason, createdAt, updatedAt
  Relations: user, unit, room, bed, occupants[], payments[], maintenanceRequests[]

MODEL: Occupant
  occupantId (Int, PK), leaseId (Int, FK->Lease), userId (Int, FK->User),
  occupantType (LEASE_HOLDER|OCCUPANT|ROOMMATE), moveInDate, moveOutDate
  Relations: lease, user

MODEL: Payment
  paymentId (Int, PK), leaseId (Int, FK->Lease), amountPaid (Decimal),
  method (CREDIT_CARD|DEBIT_CARD|BANK_TRANSFER|CHECK|CASH),
  transactionDate (DateTime), isSuccessful (Boolean), createdAt
  Relations: lease

MODEL: MaintenanceRequest
  requestId (Int, PK), leaseId (Int, FK->Lease), createdByUserId (Int, FK->User),
  assignedStaffId (Int?, FK->User), category (PLUMBING|HVAC|ELECTRICAL|INTERNET|APPLIANCE|STRUCTURAL|OTHER),
  description (String), location (String?), status (OPEN|IN_PROGRESS|RESOLVED|CLOSED),
  priority (LOW|MEDIUM|HIGH|EMERGENCY), resolvedAt, resolutionReason, createdAt, updatedAt
  Relations: lease, createdBy, assignedStaff, comments[]

MODEL: MaintenanceComment
  id (String, PK), requestId (Int, FK->MaintenanceRequest), userId (Int, FK->User),
  content (String?), attachmentUrl (String?), createdAt
  Relations: request, user
`.trim();

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly model;

  private readonly systemPrompt = `
You are Blaze AI, the intelligent assistant for MavHousing, the student housing system at the University of Texas at Arlington (UTA).

Your personality and tone:
- Professional, clear, and helpful.
- You address the student by their first name.
- You never use emojis in your replies.
- You never use em dashes. Use commas, periods, or semicolons instead.
- You are concise. Provide the information, then offer further help.
- If you do not have data or something went wrong, be honest and suggest next steps.
- You sign off with: "Best regards, Blaze AI"

Important rules:
- You are responding via EMAIL. Format replies as clean HTML for email clients.
- Use simple inline styles (no CSS classes).
- When presenting data, use clean HTML tables or bullet points.
- NEVER fabricate data. Only use the factual data provided to you.
- If data is empty or missing, say so honestly.
- Keep replies under 300 words unless the data requires more.
`.trim();

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY not set. Blaze AI will use fallback responses.',
      );
    }
    const genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  /**
   * Given a user message and their RBAC context, generate database query plans.
   * Returns an array of query operations the DatabaseTool should execute.
   */
  async planQueries(
    message: string,
    userRole: string,
    userName: string,
    userId: number,
  ): Promise<
    Array<{
      operation: 'query' | 'findOne' | 'count' | 'aggregate' | 'groupBy';
      description: string;
      params: Record<string, any>;
    }>
  > {
    const prompt = `
You are a database query planner for a university housing system.

${DATABASE_SCHEMA}

CURRENT USER:
- Name: ${userName}
- Role: ${userRole}
- userId: ${userId}

RBAC RULES:
- STUDENT: Can only see their own data. Always filter by userId = ${userId}.
- STAFF: Can see data for their assigned property and its residents.
- ADMIN: Can see all data across the system.

USER MESSAGE: "${message}"

Generate a JSON array of database query operations to answer this question.
Each operation must have: operation, description, params.

Available operations:
1. "query" - findMany: params = { model, where?, include?, select?, orderBy?, take? }
2. "findOne" - findFirst: params = { model, where, include? }
3. "count" - count records: params = { model, where? }
4. "aggregate" - sum/avg/min/max: params = { model, where?, _sum?, _avg?, _min?, _max? }
5. "groupBy" - group and count: params = { model, by: string[], where?, _count?, _sum? }

IMPORTANT:
- Model names must be one of: user, property, unit, room, bed, application, lease, occupant, payment, maintenancerequest, maintenancecomment
- For STUDENT role, ALWAYS include userId: ${userId} in where clauses for their own data.
- Use "include" to join related data (e.g., include: { user: true, unit: { include: { property: true } } })
- For decimal fields (amountPaid, totalDue, dueThisMonth, baseRate), use _sum, _avg etc.
- Return [] if the message is just a greeting or cannot be answered from the database.
- Limit results to 25 unless the user asks for all.

EXAMPLES:
- "What's my lease?" (STUDENT, userId=5) -> [{"operation":"query","description":"Your active leases","params":{"model":"lease","where":{"userId":5},"include":{"unit":{"include":{"property":true}},"room":true,"bed":true,"payments":true}}}]
- "How many open maintenance requests?" -> [{"operation":"count","description":"Open maintenance requests","params":{"model":"maintenancerequest","where":{"status":"OPEN"}}}]
- "Total rent collected this month" (ADMIN) -> [{"operation":"aggregate","description":"Total rent collected","params":{"model":"payment","_sum":{"amountPaid":true},"where":{"isSuccessful":true}}}]
- "Show properties and vacancy" -> [{"operation":"query","description":"All properties","params":{"model":"property","include":{"units":{"include":{"rooms":{"include":{"beds":true}}}}}}}]
- "Hi there" -> []

JSON array:`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      this.logger.error(`Gemini query planning failed: ${error}`);
      return [];
    }
  }

  /**
   * Compose a professional reply as Blaze AI given query results.
   */
  async composeReply(
    userName: string,
    userRole: string,
    originalMessage: string,
    queryResults: Array<{ description: string; data: string }>,
  ): Promise<string> {
    const dataSection =
      queryResults.length > 0
        ? queryResults
            .map((r) => `--- ${r.description} ---\n${r.data}`)
            .join('\n\n')
        : 'No specific data was retrieved.';

    const prompt = `
${this.systemPrompt}

Context:
- You are replying to: ${userName} (role: ${userRole})
- Their message was: "${originalMessage}"

Here is the data retrieved from our housing system:
${dataSection}

Compose your email reply as Blaze AI. Use HTML formatting suitable for email.
- If there is structured data, present it in a clean, readable way using HTML tables or styled lists.
- If no data was found, be helpful and suggest what they can ask about.
- If the message was a greeting, introduce yourself and list what you can help with.
- Do NOT wrap your response in code blocks. Return raw HTML only.
- Do NOT use emojis.
- Do NOT use em dashes. Use commas, periods, or semicolons.
- Present monetary values with dollar signs and two decimal places.
- Format dates in a readable way (e.g., "January 15, 2026").
- For phone numbers stored as BigInt, format them properly.

Your reply:`;

    try {
      const result = await this.model.generateContent(prompt);
      let reply = result.response.text().trim();
      // Strip markdown code fences if Gemini wraps them
      reply = reply
        .replace(/^```html?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      return reply;
    } catch (error) {
      this.logger.error(`Gemini reply composition failed: ${error}`);
      return this.fallbackReply(userName, queryResults);
    }
  }

  private fallbackReply(
    userName: string,
    queryResults: Array<{ description: string; data: string }>,
  ): string {
    if (queryResults.length === 0) {
      return `<p>Hi ${userName},</p><p>I am Blaze AI, your MavHousing assistant. I was not able to understand your request. You can ask me about your lease, payments, maintenance requests, available housing, and more.</p><p>Best regards,<br>Blaze AI</p>`;
    }

    const sections = queryResults
      .map(
        (r) =>
          `<h3>${r.description}</h3><pre style="background:#f3f4f6;padding:12px;border-radius:8px;overflow-x:auto;font-size:13px;">${r.data}</pre>`,
      )
      .join('');

    return `<p>Hi ${userName},</p><p>Here is what I found:</p>${sections}<p>Best regards,<br>Blaze AI</p>`;
  }
}
