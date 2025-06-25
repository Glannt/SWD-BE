import { Module } from '@nestjs/common';
import { AskController } from './controllers/ask.controller';
import { SystemController } from './controllers/system.controller';
import { AskService } from './services/ask.service';
import { IngestService } from './services/ingest.service';
import { ConfigModule } from '../config/config.module';
import { GeminiModule } from '../gemini/gemini.module';
import { PineconeModule } from '../pinecone/pinecone.module';
import { MongoDbDataModule } from '../mongo/mongo.module';

@Module({
  imports: [
    PineconeModule,
    MongoDbDataModule,
    GeminiModule,
    ConfigModule,
  ],
  controllers: [AskController, SystemController],
  providers: [
    AskService,
    IngestService,
  ],
  exports: [
    AskService,
    IngestService,
  ],
})
export class ChatbotModule {}
