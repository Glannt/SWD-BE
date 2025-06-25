import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
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
  // app.setGlobalPrefix(configService.get<string>('GLOBAL_PREFIX') || 'api');

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
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true,
    preflightContinue: false,
  });

  // Enhanced Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('🎓 FPT University Chatbot API')
    .setDescription('Advanced RAG-based career counseling chatbot with AI and enterprise features')
    .setVersion('2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('app', 'Application endpoints')
    .addTag('assistant', 'Pinecone Assistant endpoints (Primary AI System)')
    .addTag('chatbot', 'AI Chatbot endpoints (Legacy Pinecone + Gemini)')
    .addTag('rag', 'RAG Chat endpoints (Simplified + Gemini)')
    .addTag('auth', 'Authentication & Authorization')
    .addTag('users', 'User management')
    .addTag('chat', 'Chat functionality')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: '🎓 FPT University Chatbot API Documentation',
  });

  // Serve static files
  app.useStaticAssets(path.join(__dirname, '..', 'public'));

  // Auto-seed database if needed
  console.log('🌱 Checking database and auto-seeding if needed...');
  try {
    const dataSeedService = app.get(DataSeedService);
    await dataSeedService.checkAndSeedData();
    console.log('✅ Database check and seed process completed');
  } catch (error) {
    console.error('❌ Error during database seed check:', error);
    console.warn('⚠️ Application will continue, but some features may not work without data');
  }

  // Initialize Pinecone Assistant and auto-upload documents
  const pineconeAssistantService = app.get(PineconeAssistantService);

  try {
    // Check Pinecone Assistant status
    console.log('\n🤖 Checking Pinecone Assistant Status...');
    const assistantStatus = await pineconeAssistantService.getAssistantStatus();
    
    console.log('🎯 Pinecone Assistant Analysis:');
    console.log(`   🤖 Assistant Status: ${assistantStatus.status}`);
    console.log(`   ❤️ Health: ${assistantStatus.healthy ? 'Healthy' : 'Unhealthy'}`);
    console.log(`   📄 Documents: ${assistantStatus.fileCount} files`);
    console.log(`   ⏰ Created: ${assistantStatus.createdAt ? new Date(assistantStatus.createdAt).toLocaleDateString() : 'Unknown'}`);
    console.log(`   ═══════════════════════════════`);

    if (!assistantStatus.healthy) {
      console.log('\n❌ Critical: Pinecone Assistant is not healthy!');
      console.log('\n🔧 Resolution Required:');
      console.log('1. Verify PINECONE_API_KEY is valid and active');
      console.log('2. Check Pinecone service status');
      console.log('3. Ensure sufficient quota in your Pinecone account');
      console.log('4. Verify network connectivity to Pinecone');
      console.log('\n📞 Visit https://app.pinecone.io for account management.');
      // Don't exit - let the app start but with warnings
    } else {
      // Auto-upload FPT documents if healthy
      console.log('\n📚 Auto-uploading FPT University documents...');
      const uploadSuccess = await pineconeAssistantService.autoUploadFPTDocuments();
      
      if (uploadSuccess) {
        console.log('✅ Documents are ready!');
      } else {
        console.log('⚠️ Documents upload failed, but application will continue');
      }
    }

    console.log('\n✅ Pinecone Assistant Ready!');
    console.log('═══════════════════════════════════════════');
    console.log('🎯 System Overview:');
    console.log('   📚 Knowledge Source: Pinecone Assistant');
    console.log('   🤖 AI Model: GPT-4o via Pinecone');
    console.log('   📄 Document Processing: Automatic chunking & vectorization');
    console.log('   🔍 Search: Semantic similarity with citations');
    console.log('   ✅ Status: Ready for Production');

    console.log('\n🔥 Enhanced Features:');
    console.log('   🎯 Document-based Q&A with citations');
    console.log('   📚 Automatic document processing');
    console.log('   🧠 GPT-4o powered responses');
    console.log('   🔗 Source attribution for transparency');

    console.log('\n📝 Quick Start:');
    console.log('1. 📤 Upload documents: POST /assistant/upload');
    console.log('2. 💬 Ask questions: POST /assistant/chat');
    console.log('3. 📊 Check status: GET /assistant/status');
    console.log('4. 📋 View files: GET /assistant/files');

    console.log('\n🔗 Useful Commands:');
    console.log('   npm run assistant:upload  # Upload FPT University documents');
    console.log('   npm run start:dev         # Start development server');
    console.log('   npm run assistant:status  # Check assistant status');

  } catch (error) {
    console.error('\n💥 Pinecone Assistant Initialization Failed:', error);

    console.log('\n🔧 Troubleshooting Guide:');
    console.log('\n1. 🎯 Pinecone Issues:');
    console.log('   • Validate API key: check PINECONE_API_KEY in .env');
    console.log('   • Check account: visit https://app.pinecone.io');
    console.log('   • Verify quotas: ensure sufficient Pinecone usage limits');

    console.log('\n2. 🔧 Environment Issues:');
    console.log('   • Review .env file: ensure PINECONE_API_KEY is set');
    console.log('   • Check network: verify external API access');
    console.log('   • Validate dependencies: npm install');

    console.log('\n3. 📞 Support Resources:');
    console.log('   • Check Pinecone status: https://status.pinecone.io');
    console.log('   • Review logs for detailed error messages');
    console.log('   • Contact Pinecone support if issues persist');

    console.warn('\n⚠️ Application will continue with limited functionality');
  }


  const port = configService.get<string>('PORT') || 3000;
  await app.listen(port);

  console.log('🚀 FPT University Chatbot API started successfully!');
  console.log(`📍 Server: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`💬 Chat Interface: http://localhost:${port}`);
  console.log(`🎯 API Version: v1 (default)`);
}

bootstrap();
