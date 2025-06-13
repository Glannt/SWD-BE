import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { NestRedisModule } from 'src/redis/redis.module';
import { MailModule } from 'src/mail/mail.module';
@Module({
  imports: [
    MailModule,
    NestRedisModule,
    UserModule, // Import UserModule để sử dụng UserService
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRE'),
        },
      }),
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
