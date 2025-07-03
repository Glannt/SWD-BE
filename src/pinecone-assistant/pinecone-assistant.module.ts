import { Module } from '@nestjs/common';
import { PineconeAssistantService } from './pinecone-assistant.service';
import { PineconeAssistantController } from './pinecone-assistant.controller';
import { ChatsessionModule } from '../chatsession/chatsession.module';
import { HubspotModule } from '../hubspot/hubspot.module';
import { GeminiModule } from '../gemini/gemini.module';
import { ConfigModule } from '@/config/config.module';

@Module({
  imports: [ConfigModule, ChatsessionModule, HubspotModule, GeminiModule],
  controllers: [PineconeAssistantController],
  providers: [PineconeAssistantService],
  exports: [PineconeAssistantService],
})
export class PineconeAssistantModule {}
