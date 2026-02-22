import { NestFactory } from '@nestjs/core';
import { InternalApiModule } from './internal-api.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

// Fix: BigInt cannot be serialized by JSON.stringify (Prisma phone fields are BigInt)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(InternalApiModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties not in DTO
      forbidNonWhitelisted: true, // throws error if extra props exist
      transform: true, // automatically transforms payloads to DTO classes
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Internal-API for MavHousing')
    .setDescription('All Internal worings + Database')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(process.env.port ?? 3009);

  console.log(
    `Server started at ${process.env.HOST ?? '127.0.0.1'}:${process.env.port ?? 3009}`,
  );
  console.log(
    `Swagger started at ${process.env.HOST ?? '127.0.0.1'}:${process.env.port ?? 3009}/api`,
  );
}
bootstrap();
