import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IngestService } from '../chatbot/services/ingest.service';

import * as dotenv from 'dotenv';
import { MongoDbDataService } from '@/mongo/mongo.service';

// Load environment variables
dotenv.config();

/**
 * CLI tool để ingest dữ liệu có sẵn từ MongoDB vào Pinecone
 * (không cần seed từ JSON, chỉ sử dụng dữ liệu có sẵn)
 */
async function bootstrap() {
  console.log('🚀 Starting MongoDB data ingestion to Pinecone...');
  console.log('💡 Using existing data from MongoDB (no JSON seeding required)');
  console.log('\n📋 Configuration:');
  console.log('- Pinecone Index:', process.env.PINECONE_INDEX_NAME || 'fpt-university-768d');
  console.log('- Gemini API Key:', process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing');
  console.log('- Pinecone API Key:', process.env.PINECONE_API_KEY ? '✅ Configured' : '❌ Missing');
  console.log('- MongoDB URI:', process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing');

  const app = await NestFactory.createApplicationContext(AppModule);
  const ingestService = app.get(IngestService);
  const mongoDbDataService = app.get(MongoDbDataService);

  try {
    // Kiểm tra dữ liệu có sẵn trong MongoDB
    console.log('\n🔍 Checking existing MongoDB data...');
    const stats = await mongoDbDataService.getDataStatistics();
    const totalRecords = stats.campuses + stats.majors + stats.tuitionFees + stats.scholarships;

    console.log('📊 Current MongoDB Data:');
    console.log(`   🏫 Campuses: ${stats.campuses}`);
    console.log(`   🎓 Majors: ${stats.majors}`);
    console.log(`   💰 Tuition Fees: ${stats.tuitionFees}`);
    console.log(`   🏆 Scholarships: ${stats.scholarships}`);
    console.log(`   📝 Total Records: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('\n❌ No data found in MongoDB!');
      console.log('🔧 Please ensure:');
      console.log('1. MongoDB connection is correct');
      console.log('2. Database name is correct');
      console.log('3. Data has been imported to MongoDB');
      console.log('4. Collections exist: campuses, majors, tuitionfees, scholarships');
      console.log('\n📞 Contact admin to import data into MongoDB.');
      process.exit(1);
    }

    // Kiểm tra system status
    console.log('\n🔍 Checking system status...');
    const status = await ingestService.checkDataStatus();

    console.log('📊 System Status:');
    console.log(`- MongoDB: ${status.mongodb.status} - ${status.mongodb.message || ''}`);
    console.log(`- Pinecone: ${status.pinecone.status} - ${status.pinecone.message || ''}`);
    console.log(`💡 Recommendation: ${status.recommendation}`);

    if (status.mongodb.status === 'error') {
      console.log('\n❌ MongoDB connection failed!');
      console.log('🔧 Please check:');
      console.log('1. MongoDB service is running');
      console.log('2. MONGODB_URI in .env file');
      console.log('3. Database access permissions');
      process.exit(1);
    }

    if (status.pinecone.status === 'error') {
      console.log('\n❌ Pinecone connection failed!');
      console.log('🔧 Please check:');
      console.log('1. PINECONE_API_KEY in .env file');
      console.log('2. PINECONE_INDEX_NAME exists');
      console.log('3. Pinecone service availability');
      process.exit(1);
    }

    // Bắt đầu quá trình ingest từ MongoDB
    console.log(`\n📄 Starting ingestion of ${totalRecords} records from MongoDB...`);
    console.log('⏳ This may take a few minutes depending on data size...');

    const chunksProcessed = await ingestService.ingestData();

    console.log('\n✅ MongoDB data ingestion completed successfully!');
    console.log(`📊 Results:`);
    console.log(`   - Source: MongoDB Database (${totalRecords} records)`);
    console.log(`   - Chunks processed: ${chunksProcessed}`);
    console.log(`   - Vector database: Updated with realtime data`);
    console.log(`   - Status: Ready for chatbot queries`);

    console.log('\n🎉 System ready!');
    console.log('📝 Next steps:');
    console.log('1. Run: pnpm run start:dev');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Test chatbot with realtime MongoDB data!');
    console.log('4. Try questions about campuses, majors, tuition fees, scholarships');

    console.log('\n💡 The chatbot now uses:');
    console.log('  🎯 MongoDB realtime data (primary source)');
    console.log('  🔍 Pinecone vector search (for enhanced context)');
    console.log('  🧠 Gemini AI (for intelligent responses)');
    console.log('  🔄 Auto-fallback (for edge cases)');

    console.log('\n🔄 To re-ingest when MongoDB data changes:');
    console.log('   pnpm run ingest');

  } catch (error) {
    console.error('\n❌ Error during ingestion:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check MongoDB connection and ensure data exists');
    console.log('2. Verify Pinecone and Gemini API keys are valid');
    console.log('3. Ensure all environment variables are set correctly');
    console.log('4. Check MongoDB collections have data:');
    console.log('   mongosh [db_name] --eval "db.majors.countDocuments()"');
    console.log('5. Verify network connectivity to external services');
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Chạy ứng dụng
bootstrap();
