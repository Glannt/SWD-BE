import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { QdrantService } from './qdrant.service';
import { GeminiService } from './gemini.service';
import { DocumentProcessorService } from './document-processor.service';
import { RAGService } from './rag.service';

@Module({
  imports: [ConfigModule],
  providers: [
    QdrantService,
    GeminiService,
    DocumentProcessorService,
    RAGService,
  ],
  exports: [RAGService, QdrantService, GeminiService, DocumentProcessorService],
})
export class RAGModule {}
