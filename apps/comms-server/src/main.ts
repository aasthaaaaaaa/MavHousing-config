import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { CommsServerModule } from './comms-server.module';

async function bootstrap() {
  const app = await NestFactory.create(CommsServerModule);

  // Enable DTO validation globally
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Comms Server API')
    .setDescription('API for sending templated emails and SMS via Mav Housing')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory); //  /api endpoint

  await app.listen(process.env.port ?? 3000);
  console.log(
    `Comms Server started at ${process.env.HOST ?? '127.0.0.1'}:${process.env.port ?? 3000}/comms`,
  );
  console.log(
    `Swagger started at ${process.env.HOST ?? '127.0.0.1'}:${process.env.port ?? 3000}/api`,
  );
}
bootstrap();
