import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { User, UserSchema } from '@/entity/user.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
