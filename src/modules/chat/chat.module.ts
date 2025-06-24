import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RAGModule } from '../../rag/rag.module';
import * as fs from 'fs';

// Đảm bảo thư mục uploads tồn tại
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

@Module({
  imports: [
    RAGModule,
    MulterModule.register({
      dest: uploadsDir,
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
