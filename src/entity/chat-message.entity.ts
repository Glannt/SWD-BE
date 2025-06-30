import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ChatSession } from './chat-session.entity';
import { applySmartIdField } from '../common/middleware/assign_custome_id.middleware';

export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
  STAFF = 'staff',
}

@Schema({ timestamps: true, collection: 'chatMessages' })
export class ChatMessage extends Document {
  @Prop({ type: String, ref: 'ChatSession' })
  session: ChatSession;

  @Prop({ enum: MessageSender, required: true })
  sender: MessageSender;

  @Prop({ required: true })
  content: string;

  @Prop()
  intent: string;

  @Prop()
  confidence: number;

  @Prop()
  chat_message_id: string;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ session: 1 });
ChatMessageSchema.index({ createdAt: 1 });

applySmartIdField(ChatMessageSchema, ChatMessage.name, 'chat_message_id');
