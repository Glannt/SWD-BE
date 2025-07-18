import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

import { NestRedisModule } from '@/redis/redis.module';
import { ConfigModule } from '@/config/config.module';
import { ConfigService } from '@/config/config.service';

@Module({
  imports: [
    ConfigModule,
    NestRedisModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          service:
            configService.getMailHost() || configService.get('MAIL_SERVICE'),
          // port: configService.getMailPort(),
          // host: configService.getMailHost(),
          auth: {
            user: configService.getMailUser(),
            pass: configService.getMailPass(),
          },
        },
        defaults: {
          from: `"No Reply" <${configService.getMailFrom()}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
