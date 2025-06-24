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
import { IngestService } from './chatbot/services/ingest.service';
import { MongoDbDataService } from './mongo/mongo.service';

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
    .addTag('chatbot', 'AI Chatbot endpoints (Pinecone + Gemini)')
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

  // init pinecone
  const ingestService = app.get(IngestService);
  const mongoDbDataService = app.get(MongoDbDataService);

  try {
    // Detailed MongoDB data analysis
    console.log('\n🔍 Analyzing MongoDB Data...');
    const stats = await mongoDbDataService.getDataStatistics();
    const totalRecords = stats.campuses + stats.majors + stats.tuitionFees + stats.scholarships;

    console.log('📊 MongoDB Collections Analysis:');
    console.log(`   🏫 Campuses: ${stats.campuses} records`);
    console.log(`   🎓 Academic Majors: ${stats.majors} records`);
    console.log(`   💰 Tuition Fees: ${stats.tuitionFees} records`);
    console.log(`   🏆 Scholarships: ${stats.scholarships} records`);
    console.log(`   ═══════════════════════════════`);
    console.log(`   📝 Total Available: ${totalRecords} records`);

    if (totalRecords === 0) {
      console.log('\n❌ Critical: No data available in MongoDB!');
      console.log('\n🔧 Resolution Required:');
      console.log('1. Verify MongoDB connection string');
      console.log('2. Confirm database name is correct');
      console.log('3. Ensure collections exist and contain data');
      console.log('4. Check read permissions for database');
      console.log('\n📋 Expected Collections:');
      console.log('   - campuses (campus information)');
      console.log('   - majors (academic programs)');
      console.log('   - tuitionfees (fee structures)');
      console.log('   - scholarships (financial aid)');
      console.log('\n📞 Contact database administrator to populate MongoDB.');
      process.exit(1);
    }

    // Comprehensive system health check
    console.log('\n🏥 System Health Check...');
    const systemStatus = await ingestService.checkDataStatus();

    console.log('📋 Component Status:');
    console.log(`   MongoDB: ${systemStatus.mongodb.status} - ${systemStatus.mongodb.message || 'No additional info'}`);
    console.log(`   Pinecone: ${systemStatus.pinecone.status} - ${systemStatus.pinecone.message || 'No additional info'}`);
    console.log(`   Recommendation: ${systemStatus.recommendation}`);

    if (systemStatus.mongodb.status !== 'healthy') {
      console.log('\n❌ MongoDB Health Check Failed!');
      console.log('🔧 MongoDB Troubleshooting:');
      console.log('1. Verify MongoDB service is running');
      console.log('2. Check network connectivity to MongoDB server');
      console.log('3. Validate connection credentials');
      console.log('4. Ensure database permissions are sufficient');
      process.exit(1);
    }

    if (systemStatus.pinecone.status !== 'healthy') {
      console.log('\n❌ Pinecone Health Check Failed!');
      console.log('🔧 Pinecone Troubleshooting:');
      console.log('1. Verify PINECONE_API_KEY is correct and active');
      console.log('2. Confirm PINECONE_INDEX_NAME exists in your account');
      console.log('3. Check Pinecone service status');
      console.log('4. Verify network access to Pinecone APIs');
      process.exit(1);
    }

    // Execute MongoDB-exclusive ingestion
    console.log(`\n🚀 Initiating MongoDB Data Ingestion...`);
    console.log(`📊 Processing ${totalRecords} database records`);
    console.log('⏳ Estimated time: 2-5 minutes (depends on data volume)');
    console.log('🔄 Progress will be shown in batches...');

    const startTime = Date.now();
    const chunksProcessed = await ingestService.ingestFromMongoDB();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n🎉 MongoDB Ingestion Completed Successfully!');
    console.log('═══════════════════════════════════════════');
    console.log(`📊 Ingestion Summary:`);
    console.log(`   ⏱️  Duration: ${duration} seconds`);
    console.log(`   📥 Source: MongoDB Database`);
    console.log(`   📄 Records Processed: ${totalRecords}`);
    console.log(`   🧠 Chunks Generated: ${chunksProcessed}`);
    console.log(`   🎯 Vector Database: Updated`);
    console.log(`   ✅ Status: Ready for Production`);

    console.log('\n🔥 Chatbot Capabilities Enhanced:');
    console.log('   🎯 Real-time MongoDB queries (primary)');
    console.log('   🔍 Vector similarity search (context enhancement)');
    console.log('   🧠 AI-powered response generation');
    console.log('   🔄 Intelligent fallback mechanisms');

    console.log('\n📝 Next Steps:');
    console.log('1. 🚀 Start the application: pnpm run start:dev');
    console.log('2. 🌐 Access chatbot: http://localhost:3000');
    console.log('3. 🧪 Test with queries about FPT University');
    console.log('4. 📊 Monitor performance via system endpoints');

    console.log('\n💡 Maintenance Notes:');
    console.log('   • Re-run this script when MongoDB data is updated');
    console.log('   • Monitor vector database for optimal performance');
    console.log('   • Regular health checks recommended');
    console.log('   • Backup vector embeddings before major updates');

    console.log('\n🔗 Useful Commands:');
    console.log('   pnpm run ingest:mongodb  # Re-ingest when data changes');
    console.log('   pnpm run start:dev       # Start development server');
    console.log('   pnpm run test:integration # Run integration tests');

  } catch (error) {
    console.error('\n💥 Ingestion Process Failed:', error);

    console.log('\n🔧 Comprehensive Troubleshooting Guide:');
    console.log('\n1. 🗄️  MongoDB Issues:');
    console.log('   • Check connection: mongosh --eval "db.adminCommand(\'ping\')"');
    console.log('   • Verify data: mongosh [db] --eval "db.majors.countDocuments()"');
    console.log('   • Test permissions: ensure read access to all collections');

    console.log('\n2. 🎯 Pinecone Issues:');
    console.log('   • Validate API key: check account dashboard');
    console.log('   • Confirm index: verify index name exists');
    console.log('   • Test connectivity: curl Pinecone API endpoints');

    console.log('\n3. 🧠 Gemini AI Issues:');
    console.log('   • Check API key: verify Google AI credentials');
    console.log('   • Verify quotas: ensure sufficient API usage limits');
    console.log('   • Test embedding: try simple embedding generation');

    console.log('\n4. 🔧 Environment Issues:');
    console.log('   • Review .env file: ensure all variables set');
    console.log('   • Check network: verify external API access');
    console.log('   • Validate dependencies: pnpm install');

    console.log('\n5. 📞 Support Resources:');
    console.log('   • Check logs for detailed error messages');
    console.log('   • Review system status via health endpoints');
    console.log('   • Contact technical team if issues persist');

    process.exit(1);
  } finally {
    await app.close();
    console.log('\n👋 Application context closed gracefully.');
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
