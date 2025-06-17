import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IngestService } from './chatbot/services/ingest.service';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Đảm bảo biến môi trường được đọc
dotenv.config();

async function bootstrap() {
  // Khởi tạo ứng dụng NestJS
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Lấy service IngestService
    const ingestService = app.get(IngestService);

    // Đường dẫn đến file JSON chứa dữ liệu
    const jsonFilePath = path.join(__dirname, '..', 'documents', 'fpt_university_2025_data.json');
    
    console.log('Bắt đầu quá trình upload dữ liệu lên Pinecone...');
    console.log(`File dữ liệu: ${jsonFilePath}`);
    
    // Xử lý dữ liệu và upload lên Pinecone
    const chunksProcessed = await ingestService.ingestJsonFile(jsonFilePath);
    
    console.log(`Đã xử lý thành công ${chunksProcessed} đoạn dữ liệu và upload lên Pinecone.`);
  } catch (error) {
    console.error('Lỗi khi upload dữ liệu:', error);
  } finally {
    // Đóng ứng dụng
    await app.close();
  }
}

// Chạy script
bootstrap(); 