import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IntakeBatch } from './intake-batches.entity';
import { Types } from 'mongoose';

@Schema({ collection: 'english-levels' })
export class EnglishLevel extends Document {
  @Prop({ type: Types.ObjectId, ref: 'IntakeBatch' })
  batch: IntakeBatch;

  @Prop()
  levelNumber: number;

  @Prop({ required: true })
  feeAmount: number;

  @Prop()
  description: string;

  @Prop({ default: 6 })
  maxLevel: number;
}

export const EnglishLevelSchema = SchemaFactory.createForClass(EnglishLevel);
EnglishLevelSchema.index({ batch: 1, levelNumber: 1 }, { unique: true });
