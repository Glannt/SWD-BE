import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RAGService } from './rag/rag.service';
import { Logger } from '@nestjs/common';
import * as path from 'path';

/**
 * Script để xử lý tài liệu mẫu
 */
async function bootstrap() {
  const logger = new Logger('IngestSample');

  try {
    // Khởi tạo ứng dụng NestJS
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Lấy RAGService
    const ragService = app.get(RAGService);

    // Đường dẫn đến tài liệu mẫu
    const sampleDocPath = path.join(
      process.cwd(),
      'documents',
      'Information_FPTU.docx',
    );
    logger.log(`Processing sample document: ${sampleDocPath}`);

    // Xử lý tài liệu
    const result = await ragService.ingestDocument(sampleDocPath);

    if (result.success) {
      logger.log(`Successfully processed sample document: ${result.message}`);
    } else {
      logger.error(`Failed to process sample document: ${result.message}`);
    }

    // Đóng ứng dụng
    await app.close();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error processing sample document: ${errorMessage}`);
    process.exit(1);
  }
}

// Sử dụng void để đánh dấu rõ ràng rằng chúng ta không quan tâm đến Promise trả về
void bootstrap();
