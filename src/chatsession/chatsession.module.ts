import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSession, ChatSessionSchema } from '../entity/chat-session.entity';
import { ChatMessage, ChatMessageSchema } from '../entity/chat-message.entity';
import { User, UserSchema } from '../entity/user.entity';
import { ChatsessionController } from './chatsession.controller';
import { ChatsessionService } from './chatsession.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ChatsessionController],
  providers: [ChatsessionService],
  exports: [ChatsessionService],
})
export class ChatsessionModule {}
