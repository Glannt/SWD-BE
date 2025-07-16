import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { NestRedisModule } from '../redis/redis.module';
import { MailModule } from '../mail/mail.module';
import { GoogleStrategy } from './strategy/google.strategy';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Module({
  imports: [
    MailModule,
    NestRedisModule,
    UserModule, // Import UserModule để sử dụng UserService
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getJwtAccessSecret(),
        signOptions: {
          expiresIn: configService.getJwtAccessExpire(),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshGuard,
    GoogleAuthGuard,
    GoogleStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtRefreshGuard],
})
export class AuthModule {}
