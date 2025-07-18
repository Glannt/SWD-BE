import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from '../entity/user.entity';
import { NestRedisModule } from '@/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NestRedisModule,
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService], // Export để sử dụng trong AuthModule
})
export class UserModule {}
