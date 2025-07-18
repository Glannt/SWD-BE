import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../entity/user.entity';
import { ChatSession, ChatSessionSchema } from '../entity/chat-session.entity';
import { ChatMessage, ChatMessageSchema } from '../entity/chat-message.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminService } from './admin.service';
import { NotificationModule } from '../notification/notification.module';
import { NestRedisModule } from '@/redis/redis.module';
import { ConfigModule } from '@/config/config.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    ScheduleModule.forRoot(),
    NestRedisModule,
    NotificationModule,
    ConfigModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
