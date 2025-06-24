import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ScholarshipCoverage {
  FULL = 'Full',
  PARTIAL = 'Partial',
  PERCENTAGE = 'percentage'
}

@Schema({ collection: 'scholarships' })
export class Scholarship extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  value: number;

  @Prop({ enum: ScholarshipCoverage, required: true })
  coverage: ScholarshipCoverage;

  @Prop()
  requirements: string;

  @Prop()
  applicationProcess: string;

  @Prop()
  deadlineInfo: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  totalSlots: number;

  @Prop()
  maintenanceCondition: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;
}

export const ScholarshipSchema = SchemaFactory.createForClass(Scholarship);
