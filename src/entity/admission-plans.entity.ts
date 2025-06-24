import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AdmissionYear } from './admission-year.entity';
import { Types } from 'mongoose';
import { applySmartIdField } from '../common/middleware/assign_custome_id.middleware';

export enum AdmissionMethod {
  DIRECT = 'Direct',
  EXAM = 'Exam',
  PORTFOLIO = 'Portfolio',
}

@Schema({ collection: 'admissionPlans' })
export class AdmissionPlan extends Document {
  @Prop({ type: Types.ObjectId, ref: 'AdmissionYear' })
  admissionYear: AdmissionYear;

  @Prop({ required: true })
  planName: string;

  @Prop()
  description: string;

  @Prop({ enum: AdmissionMethod, required: true })
  method: AdmissionMethod;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

}

export const AdmissionPlanSchema = SchemaFactory.createForClass(AdmissionPlan);

applySmartIdField(AdmissionPlanSchema, AdmissionPlan.name, 'admission_plan_id');