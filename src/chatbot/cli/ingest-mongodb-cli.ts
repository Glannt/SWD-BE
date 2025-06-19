import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { IngestService } from '../services/ingest.service';
import { MongoDbDataService } from '../services/mongodb-data.service';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * CLI tool chuyên dụng để ingest dữ liệu có sẵn từ MongoDB vào Pinecone
 * Không cần seed từ JSON, chỉ sử dụng dữ liệu realtime có sẵn
 */
async function bootstrap() {
  console.log('🚀 MongoDB-to-Pinecone Ingestion Tool');
  console.log('💡 Processing existing MongoDB data (no external files needed)');
  console.log('\n📋 Configuration Check:');
  console.log('- Pinecone Index:', process.env.PINECONE_INDEX_NAME || 'fpt-university-768d');
  console.log('- Gemini API Key:', process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing');
  console.log('- Pinecone API Key:', process.env.PINECONE_API_KEY ? '✅ Configured' : '❌ Missing');
  console.log('- MongoDB URI:', process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing');
  
  const app = await NestFactory.createApplicationContext(AppModule);
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
}

// Execute the ingestion tool
bootstrap(); 