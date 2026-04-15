import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('MCP-Agent');
  const app = await NestFactory.create(AppModule);

  // CORS — allow requests from the web frontend and other services
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('MavHousing MCP Agent')
    .setDescription(
      'AI-powered housing agent with RBAC, email gateway (Resend), ' +
      'MCP tools, and GraphQL connectivity. Connects to all MavHousing services.',
    )
    .setVersion('1.0.0')
    .addTag('Agent', 'Natural language query processing')
    .addTag('Webhook', 'Resend inbound email webhook')
    .addTag('Health', 'System health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.MCP_AGENT_PORT || 3007;
  await app.listen(port);

  logger.log(`\n${'═'.repeat(60)}`);
  logger.log(`🤖 MavHousing MCP Agent is LIVE!`);
  logger.log(`${'─'.repeat(60)}`);
  logger.log(`   🌐 HTTP Server:    http://localhost:${port}`);
  logger.log(`   📡 MCP SSE:        http://localhost:${port}/sse`);
  logger.log(`   📖 Swagger API:    http://localhost:${port}/api`);
  logger.log(`   📨 Resend Webhook: http://localhost:${port}/webhook/resend`);
  logger.log(`   🔍 Agent Query:    POST http://localhost:${port}/agent/query`);
  logger.log(`${'─'.repeat(60)}`);
  logger.log(`   ⚡ Connected to: PostgreSQL, internal-api, comms-server`);
  logger.log(`   🔒 RBAC:         ADMIN | STAFF | STUDENT`);
  logger.log(`   🔧 MCP Tools:    15+ tools across all services`);
  logger.log(`${'═'.repeat(60)}\n`);
}
bootstrap();
