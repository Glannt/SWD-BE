import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global configuration
  app.setGlobalPrefix(process.env.GLOBAL_PREFIX || 'api');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('FPT University Chatbot API')
    .setDescription('RAG-based career counseling chatbot for FPT University')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Serve static files
  app.useStaticAssets(path.join(__dirname, '..', 'public'));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log('🚀 FPT University Chatbot API started at:', `http://localhost:${port}`);
  console.log('📚 API Documentation:', `http://localhost:${port}/api/docs`);
  console.log('💬 Chat Interface:', `http://localhost:${port}`);
}

bootstrap();
