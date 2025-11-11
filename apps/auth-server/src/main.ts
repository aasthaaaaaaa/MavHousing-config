import { NestFactory } from '@nestjs/core';
import { AuthServerModule } from './auth-server.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  
  const config = new DocumentBuilder().setTitle('AuthServer').setDescription('API Playground for authentication services').addTag('auth').build()

  const app = await NestFactory.create(AuthServerModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strips properties not in DTO
      forbidNonWhitelisted: true, // throws error if extra props exist
      transform: true,       // automatically transforms payloads to DTO classes
    }),
  );

  const documentFactory = () => SwaggerModule.createDocument(app, config)

  SwaggerModule.setup('api', app, documentFactory)
  await app.listen(process.env.port ?? 3004);
  console.log(`Server started at ${process.env.HOST ?? '127.0.0.1'}:${process.env.port ?? 3004}/auth`)
  console.log(`Swagger started at ${process.env.HOST ?? '127.0.0.1'}:${process.env.port ?? 3004}/api`)
}
bootstrap(); 