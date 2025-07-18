import { NestFactory, Reflector } from '@nestjs/core';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from './config/config.service';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DataSeedService } from './common/services/data-seed.service';
import * as path from 'path';
import cookieParser from 'cookie-parser';
import { PineconeAssistantService } from './pinecone-assistant/pinecone-assistant.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Global configuration - Keep disabled for direct /ask route compatibility
  app.setGlobalPrefix(configService.get('GLOBAL_PREFIX') || 'api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1'],
  });

  // Global error handling, interceptors and pipes
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false, // Allow extra properties for flexibility
      skipMissingProperties: false,
      validateCustomDecorators: true,
      errorHttpStatusCode: 400,
    }),
  );

  // Cookie parser for session management
  app.use(cookieParser());

  // Enhanced CORS configuration
  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    credentials: true,
    preflightContinue: false,
  });

  // Enhanced Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('🎓 FPT University Chatbot API')
    .setDescription(
      'Advanced RAG-based career counseling chatbot with AI and enterprise features',
    )
    .setVersion('2.0')
    .setContact('FPTU AI Team', 'https://fpt.edu.vn', 'support@fpt.edu.vn')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Local server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description:
          'Enter JWT token (access token, not refresh token). Format: Bearer <token>',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('app', 'Application endpoints')
    .addTag('assistant', 'Pinecone Assistant endpoints (Primary AI System)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      displayRequestDuration: true,
      filter: true,
    },
    customSiteTitle: '🎓 FPT University Chatbot API Documentation',
  });

  // Serve static files
  // app.useStaticAssets(path.join(__dirname, '..', 'public'));

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log('🚀 FPT University Chatbot API started successfully!');
  console.log(`📍 Server: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`💬 Chat Interface: http://localhost:${port}`);
  console.log(`🎯 API Version: v1 (default)`);
}

bootstrap();
