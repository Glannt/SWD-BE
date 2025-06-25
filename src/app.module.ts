import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MailModule } from './mail/mail.module';
import { NestRedisModule } from './redis/redis.module';
import { DataSeedModule } from './common/services/data-seed.module';
import { PineconeAssistantModule } from './pinecone-assistant/pinecone-assistant.module';

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
        return { uri };
      },
      inject: [ConfigService],
    }),

    // Core modules
    AuthModule,        // Authentication & Authorization with email verification
    UserModule,        // User management
    PineconeAssistantModule, // AI Assistant integration

    // Supporting modules
    MailModule,        // Email service for verification
    NestRedisModule,   // Redis caching for sessions/tokens
    DataSeedModule,    // Database seeding functionality
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
