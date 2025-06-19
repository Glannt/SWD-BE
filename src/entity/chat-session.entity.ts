import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './user.entity';
import { Types } from 'mongoose';

export enum ChatSessionStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Schema({
  timestamps: { createdAt: 'startedAt', updatedAt: 'lastActivity' },
  collection: 'chatSessions',
})
export class ChatSession extends Document {
  @Prop({ required: true, unique: true })
  sessionID: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: User;

  @Prop()
  anonymousID: string;

  @Prop({ enum: ChatSessionStatus, default: ChatSessionStatus.ACTIVE })
  status: ChatSessionStatus;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
