import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { IngestService } from '../services/ingest.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

async function bootstrap() {
  console.log('🚀 Starting data ingestion process...');
  console.log('📋 Configuration:');
  console.log('- Pinecone Index:', process.env.PINECONE_INDEX_NAME || 'fpt-university-768d');
  console.log('- Gemini API Key:', process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing');
  console.log('- Pinecone API Key:', process.env.PINECONE_API_KEY ? '✅ Configured' : '❌ Missing');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const ingestService = app.get(IngestService);

  try {
    // Đường dẫn đến file JSON - sử dụng tên file chính xác
    const jsonFilePath = path.join(process.cwd(), 'documents', 'fpt_university_2025_data_v1_update.json');
    
    console.log('\n📄 Starting data ingestion from JSON file...');
    console.log('📁 File path:', jsonFilePath);
    
    const chunksProcessed = await ingestService.ingestJsonFile(jsonFilePath);
    
    console.log('✅ Data ingestion completed successfully!');
    console.log(`📊 Processed ${chunksProcessed} chunks`);
    
    console.log('\n🎉 Ready to use!');
    console.log('📝 Next steps:');
    console.log('1. Run: pnpm start');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Start chatting with the FPT University bot!');
    
  } catch (error) {
    console.error('❌ Error during ingestion:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap(); 