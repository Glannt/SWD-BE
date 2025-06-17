import { Module } from '@nestjs/common';
import { AskController } from './controllers/ask.controller';
import { AskService } from './services/ask.service';
import { GeminiService } from './services/gemini.service';
import { PineconeService } from './services/pinecone.service';
import { IngestService } from './services/ingest.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [AskController],
  providers: [AskService, GeminiService, PineconeService, IngestService],
  exports: [AskService, GeminiService, PineconeService, IngestService],
})
export class ChatbotModule {} 