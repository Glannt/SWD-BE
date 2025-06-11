import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Major } from './major.entity';
import { IntakeBatch } from './intake-batches.entity';
import { Types } from 'mongoose';

@Schema({ collection: 'tution-fees' })
export class TuitionFee extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Major' })
  major: Major;

  @Prop({ type: Types.ObjectId, ref: 'IntakeBatch' })
  batch: IntakeBatch;

  @Prop({ required: true })
  semesterRange: string;

  @Prop({ required: true })
  baseAmount: number;

  @Prop({ default: true })
  isInclusive: boolean;

  @Prop({ default: 'VND' })
  currency: string;

  @Prop({ required: true })
  effectiveFrom: Date;

  @Prop()
  effectiveTo: Date;

  @Prop({ default: true })
  includesMaterials: boolean;

  @Prop()
  notes: string;
}

export const TuitionFeeSchema = SchemaFactory.createForClass(TuitionFee);
TuitionFeeSchema.index(
  { major: 1, batch: 1, semesterRange: 1 },
  { unique: true },
);
