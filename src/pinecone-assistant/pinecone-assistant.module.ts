import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PineconeAssistantService } from './pinecone-assistant.service';
import { PineconeAssistantController } from './pinecone-assistant.controller';

@Module({
  imports: [ConfigModule],
  controllers: [PineconeAssistantController],
  providers: [PineconeAssistantService],
  exports: [PineconeAssistantService],
})
export class PineconeAssistantModule {} 