import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { IntakeBatch } from './intake-batches.entity';
import { Types } from 'mongoose';
import { applySmartIdField } from '../common/middleware/assign_custome_id.middleware';

export enum UserRole {
  STUDENT = 'student',
  STAFF = 'staff',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'user' })
export class User {
  @Prop({ unique: true })
  user_id: string;
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({
    required: function () {
      return !this.googleId;
    },
  })
  password?: string;

  @Prop()
  fullName: string;

  @Prop({ enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Prop()
  refresh_token: string;

  @Prop({ type: Types.ObjectId, ref: 'IntakeBatch' })
  batch: IntakeBatch;

  @Prop()
  dateOfBirth: Date;

  @Prop({ enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ nullable: true })
  fcmToken?: string;

  @Prop()
  googleId?: string;

  @Prop()
  googleRefreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

applySmartIdField(UserSchema, User.name, 'user_id');
