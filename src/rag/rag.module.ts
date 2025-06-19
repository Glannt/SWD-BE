import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { GeminiService } from './gemini.service';
import { DocumentProcessorService } from './document-processor.service';
import { RAGService } from './rag.service';

@Module({
  imports: [ConfigModule],
  providers: [
    GeminiService,
    DocumentProcessorService,
    RAGService,
  ],
  exports: [RAGService, GeminiService, DocumentProcessorService],
})
export class RAGModule {}
