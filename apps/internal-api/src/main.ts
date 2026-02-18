import { NestFactory } from '@nestjs/core';
import { InternalApiModule } from './internal-api.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(InternalApiModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  const config = new DocumentBuilder()
  .setTitle("Internal-API for MavHousing")
  .setDescription("All Internal worings + Database")
  .setVersion("1.0")
  .addBearerAuth()
  .build()


  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api", app, documentFactory)
  await app.listen(process.env.port ?? 3009);

  console.log(`Server started at ${process.env.HOST ?? '127.0.0.1'}:${process.env.port ?? 3009}`)
  console.log(`Swagger started at ${process.env.HOST ?? '127.0.0.1'}:${process.env.port ?? 3009}/api`)

}
bootstrap();
