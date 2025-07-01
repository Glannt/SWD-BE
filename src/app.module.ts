import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MailModule } from './mail/mail.module';
import { NestRedisModule } from './redis/redis.module';
import { DataSeedModule } from './common/services/data-seed.module';
import { PineconeAssistantModule } from './pinecone-assistant/pinecone-assistant.module';
import { ChatsessionModule } from './chatsession/chatsession.module';
import { HubspotModule } from './hubspot/hubspot.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.getMongoUri();
        return { uri };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    PineconeAssistantModule,
    ChatsessionModule,
    MailModule,
    NestRedisModule,
    DataSeedModule,
    HubspotModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
