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

  // Enable CORS for frontend (allow all origins in dev)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
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
  const port = process.env.PORT || 3009;
  await app.listen(port);

  console.log(`Server started at http://localhost:${port}`);
  console.log(`Swagger started at http://localhost:${port}/api`);
  console.log(`Bull Board started at http://localhost:${port}/queues`);
}
bootstrap();
