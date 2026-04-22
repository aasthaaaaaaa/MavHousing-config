import { Controller, Get, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AgentService } from './agent/agent.service';
import { GraphqlClientService } from './graphql/graphql-client.service';

@ApiTags('Agent')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly agentService: AgentService,
    private readonly graphqlClient: GraphqlClientService,
    private readonly configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────
  //  HEALTH
  // ─────────────────────────────────────────

  @Get()
  @ApiTags('Health')
  @ApiOperation({ summary: 'Health check' })
  getHealth() {
    return {
      status: 'ok',
      service: 'mavhousing-mcp-agent',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        swagger: '/api',
        mcpSse: '/sse',
        webhook: '/webhook/resend',
        agentQuery: 'POST /agent/query',
        publicWebhook: this.configService.get<string>('WEBHOOK_PROXY_URL'),
      },
    };
  }

  @Get('health')
  @ApiTags('Health')
  @ApiOperation({ summary: 'Detailed health check with connectivity status' })
  async getDetailedHealth() {
    const graphqlOk = await this.graphqlClient.healthCheck();

    return {
      status: 'ok',
      service: 'mavhousing-mcp-agent',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      connections: {
        graphql: graphqlOk ? 'connected' : 'unreachable',
        database: 'connected', // would fail on startup if not
      },
    };
  }

  // ─────────────────────────────────────────
  //  AGENT QUERY (REST fallback for testing)
  // ─────────────────────────────────────────

  @Post('agent/query')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Send a natural language query to the MCP agent (REST alternative to email)',
    description:
      'Simulate sending a request to the agent as if via email. ' +
      'The agent identifies the sender via email → RBAC, processes the request, and returns the result. ' +
      'In production, use the Resend webhook instead.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'message'],
      properties: {
        email: {
          type: 'string',
          description: 'Sender email address (used for RBAC identification)',
          example: 'axjh03@mavs.uta.edu',
        },
        message: {
          type: 'string',
          description: 'Natural language query',
          example: 'Show me my lease information',
        },
        subject: {
          type: 'string',
          description: 'Optional subject line',
          example: 'Housing Inquiry',
        },
      },
    },
    examples: {
      'Student - Lease Info': {
        value: { email: 'student@mavs.uta.edu', message: 'What is my lease info?' },
      },
      'Student - Payment Status': {
        value: { email: 'student@mavs.uta.edu', message: 'Have I paid rent this month?' },
      },
      'Admin - All Leases': {
        value: { email: 'admin@uta.edu', message: 'Show me all leases' },
      },
      'Admin - Generate Report': {
        value: { email: 'admin@uta.edu', message: 'Generate a finance report' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Agent processed the query and returned results' })
  @ApiResponse({ status: 200, description: 'Access denied — email not registered' })
  async agentQuery(@Body() body: { email: string; message: string; subject?: string }) {
    this.logger.log(`📨 REST query from: ${body.email} — "${body.message}"`);

    const result = await this.agentService.processRequest(
      body.email,
      body.message,
      body.subject || 'REST Query',
    );

    return {
      success: true,
      from: body.email,
      query: body.message,
      response: result,
      timestamp: new Date().toISOString(),
    };
  }
}
