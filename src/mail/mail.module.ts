import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { CacheModule } from '@nestjs/cache-manager';
import { NestRedisModule } from '../redis/redis.module';

@Module({
  imports: [
    NestRedisModule,
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          // host: configService.get<string>('EMAIL_HOST'),
          // port: configService.get<number>('EMAIL_PORT'),
          // secure: configService.get('EMAIL_SECURE') === 'true',
          // auth: {
          //   user: configService.get<string>('EMAIL_USER'),
          //   pass: configService.get<string>('EMAIL_PASSWORD'),
          // },
          service: configService.get<string>('MAIL_SERVICE'),
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'), // cần tạo app password
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get<string>('EMAIL_FROM')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
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
