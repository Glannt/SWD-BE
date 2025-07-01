import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.entity';
import { applySmartIdField } from '../common/middleware/assign_custome_id.middleware';

export enum ChatSessionStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Schema({
  timestamps: { createdAt: 'startedAt', updatedAt: 'lastActivity' },
  collection: 'chatSessions',
})
export class ChatSession extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: User;

  @Prop()
  anonymousID: string;

  @Prop({ enum: ChatSessionStatus, default: ChatSessionStatus.ACTIVE })
  status: ChatSessionStatus;

  @Prop({ unique: true, sparse: true })
  chat_session_id: string;

  @Prop({ type: String, default: null })
  tag?: string;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);

applySmartIdField(ChatSessionSchema, ChatSession.name, 'chat_session_id');

ChatSessionSchema.index({ chat_session_id: 1 }, { unique: true, sparse: true });
