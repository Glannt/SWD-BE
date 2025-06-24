import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Major } from './major.entity';
import { IntakeBatch } from './intake-batches.entity';
import { applySmartIdField } from '../common/middleware/assign_custome_id.middleware';

@Schema({ collection: 'tuitionFees' })
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

applySmartIdField(TuitionFeeSchema, TuitionFee.name, 'tuition_fee_id');
