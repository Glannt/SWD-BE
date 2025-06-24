import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Campus } from './campus.entity';
import { IntakeBatch } from './intake-batches.entity';
import { Major } from './major.entity';
import { applySmartIdField } from '../common/middleware/assign_custome_id.middleware';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

@Schema({ collection: 'campus-discounts' })
export class CampusDiscount extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Campus' })
  campus: Campus;

  @Prop({ type: Types.ObjectId, ref: 'IntakeBatch' })
  batch: IntakeBatch;

  @Prop({ required: true })
  discountName: string;

  @Prop({ enum: DiscountType, required: true })
  discountType: DiscountType;

  @Prop({ required: true })
  discountValue: number;

  @Prop()
  applicableSemesters: string;

  @Prop()
  conditions: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ required: true })
  validFrom: Date;

  @Prop()
  validTo: Date;

  @Prop()
  description: string;
}

export const CampusDiscountSchema =
  SchemaFactory.createForClass(CampusDiscount);
CampusDiscountSchema.index({ campus: 1, batch: 1 }, { unique: true });

applySmartIdField(CampusDiscountSchema, CampusDiscount.name, 'campus_discount_id');
