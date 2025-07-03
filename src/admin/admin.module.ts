import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../entity/user.entity';
import { ChatSession, ChatSessionSchema } from '../entity/chat-session.entity';
import { ChatMessage, ChatMessageSchema } from '../entity/chat-message.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
