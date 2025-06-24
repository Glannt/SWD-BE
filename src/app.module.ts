import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatbotModule } from './chatbot/chatbot.module';
import { RAGModule } from './rag/rag.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './modules/chat/chat.module';
import { MailModule } from './mail/mail.module';
import { NestRedisModule } from './redis/redis.module';
import { DataSeedModule } from './common/services/data-seed.module';
import { CampusModule } from './campus/campus.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database connection
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/FchatCareer';
        console.log('MongoDB URI:', uri);
        return { uri };
      },
      inject: [ConfigService],
    }),
    
    // Core modules
    ChatbotModule,     // Pinecone-based RAG (exports AskService)
    RAGModule,         // Simplified RAG system
    AuthModule,        // Authentication & Authorization with email verification
    UserModule,        // User management
    ChatModule,        // Chat functionality
    
    // Advanced features
    MailModule,        // Email service for verification
    NestRedisModule,   // Redis caching for sessions/tokens
    DataSeedModule, CampusModule,    // Auto-seed database from JSON files
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
