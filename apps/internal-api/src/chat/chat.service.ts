import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.module';
import { PrismaService as RealPrismaService } from '@common/prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatDocument, ChatDocumentDocument } from './chat-document.schema';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class ChatService {
  private s3Client: S3Client;

  constructor(
    private prisma: RealPrismaService,
    @InjectModel(ChatDocument.name) private chatDocModel: Model<ChatDocumentDocument>,
  ) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R3_API,
      credentials: {
        accessKeyId: process.env.R3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R3_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async buildUserContext(userId: number): Promise<string> {
    try {
      const [lease, maintenance, payments] = await Promise.all([
        this.prisma.lease.findFirst({
          where: { userId },
          include: {
            unit: { include: { property: true } },
            room: true,
            bed: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.maintenanceRequest.findMany({
          where: { createdByUserId: userId, status: { not: 'CLOSED' } },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.payment.findMany({
          where: { lease: { userId } },
          take: 5,
          orderBy: { transactionDate: 'desc' },
        }),
      ]);

      const ctx: string[] = [];

      if (lease) {
        ctx.push(
          `LEASE: Status=${lease.status}, Property=${lease.unit?.property?.name ?? 'N/A'}, Unit=${lease.unit?.unitNumber ?? 'N/A'}${lease.room ? `, Room ${lease.room.roomLetter}` : ''}${lease.bed ? `, Bed ${lease.bed.bedLetter}` : ''}, Period=${new Date(lease.startDate).toLocaleDateString()} to ${new Date(lease.endDate).toLocaleDateString()}, TotalDue=$${lease.totalDue}, DueThisMonth=$${lease.dueThisMonth}`,
        );
      } else {
        ctx.push('LEASE: No active lease found.');
      }

      if (maintenance.length > 0) {
        ctx.push(
          `OPEN MAINTENANCE (${maintenance.length}): ${maintenance.map((m) => `${m.category} - ${m.status} (${m.priority})`).join(', ')}`,
        );
      } else {
        ctx.push('MAINTENANCE: No open maintenance requests.');
      }

      if (payments.length > 0) {
        const total = payments
          .filter((p) => p.isSuccessful)
          .reduce((s, p) => s + parseFloat(p.amountPaid.toString()), 0);
        ctx.push(
          `RECENT PAYMENTS: ${payments.length} payment(s), $${total.toFixed(2)} total paid recently.`,
        );
      } else {
        ctx.push('PAYMENTS: No recent payments found.');
      }

      return ctx.join('\n');
    } catch {
      return 'User context unavailable.';
    }
  }

  async chat(
    userId: number,
    messages: { role: string; content: string }[],
  ): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const userContext = await this.buildUserContext(userId);

    const systemInstruction = `You are Blaze, the friendly AI assistant for MavHousing — the official student housing portal for the University of Texas at Arlington (UTA).

You help students with questions about:
- Their lease (start/end dates, unit details, status)
- Payments (what's owed, payment history, how to pay)
- Maintenance requests (how to submit, status of existing requests)
- Housing policies and general UTA housing information

Be warm, helpful, concise, and professional. Use the student's real data below to give personalized answers.
If you don't know something specific, direct them to contact the housing office.
Do not make up information. Keep responses brief (2-4 sentences usually).

STUDENT'S CURRENT HOUSING DATA:
${userContext}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
    });

    // Gemini requires history to start with 'user' role — skip leading assistant messages
    const rawHistory = messages
      .slice(0, -1)
      .filter((m) => m.content && m.content.trim() !== '') // Gemini rejects empty text parts
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    // Drop messages from the start until we hit a 'user' turn
    const firstUserIdx = rawHistory.findIndex((m) => m.role === 'user');
    const history = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    return result.response.text();
  }

  async getOrCreateRoom(leaseId: number): Promise<any> {
    let room = await this.prisma.chatRoom.findUnique({
      where: { leaseId },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: { leaseId },
      });
    }

    return room;
  }

  async getLeaseMembers(leaseId: number): Promise<number[]> {
    const lease = await this.prisma.lease.findUnique({
      where: { leaseId },
      include: {
        occupants: true,
      },
    });

    if (!lease) return [];

    const memberIds = new Set<number>();
    memberIds.add(lease.userId);
    lease.occupants.forEach((occ) => memberIds.add(occ.userId));

    return Array.from(memberIds);
  }

  async saveMessage(roomId: string, senderId: number, content: string) {
    return this.prisma.chatMessage.create({
      data: {
        roomId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            fName: true,
            lName: true,
            email: true,
          },
        },
        readReceipts: {
          include: {
            user: {
              select: {
                fName: true,
                lName: true,
              },
            },
          },
        },
      },
    });
  }

  async getChatHistory(leaseId: number) {
    const room = await this.getOrCreateRoom(leaseId);
    return this.prisma.chatMessage.findMany({
      where: { roomId: room.id },
      include: {
        sender: {
          select: {
            fName: true,
            lName: true,
            email: true,
          },
        },
        readReceipts: {
          include: {
            user: {
              select: {
                fName: true,
                lName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markAsRead(messageId: string, userId: number) {
    return this.prisma.readReceipt.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId,
        userId,
      },
      include: {
        user: {
          select: {
            fName: true,
            lName: true,
          },
        },
      },
    });
  }

  /** Chat: Upload chat attachment and save to Mongo */
  async uploadChatFile(leaseId: number, senderId: number, file: Express.Multer.File) {
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be under 10MB');
    }

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${randomUUID()}.${fileExt}`;
    const bucketName = 'chatfiles';

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      // Create Mongoose record
      const newDoc = new this.chatDocModel({
        leaseId,
        senderId,
        url: fileName,
        fileName: file.originalname,
        fileType: file.mimetype,
      });
      await newDoc.save();

      return newDoc;
    } catch (error) {
      console.error('S3 Upload Error for Chat:', error);
      throw new BadRequestException('Failed to upload chat file');
    }
  }

  /** Chat: Get all documents for a lease */
  async getChatDocuments(leaseId: number) {
    const docs = await this.chatDocModel.find({ leaseId }).sort({ createdAt: -1 });
    
    // Generate pre-signed URLs
    const docsWithUrls = await Promise.all(
      docs.map(async (doc) => {
        const obj = doc.toObject();
        try {
          const command = new GetObjectCommand({
            Bucket: 'chatfiles',
            Key: obj.url,
          });
          obj.url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 * 24 * 7 });
        } catch (e) {
          // fallback
        }
        return obj;
      })
    );

    return docsWithUrls;
  }
}
