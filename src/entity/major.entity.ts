import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum DeliveryMode {
  ONSITE = 'Onsite',
  ONLINE = 'Online',
  HYBRID = 'Hybrid',
}

@Schema({ collection: 'majors' })
export class Major extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop()
  description: string;

  @Prop()
  careerOpportunities: string;

  @Prop()
  generalAdmissionRequirements: string;

  @Prop({ required: true })
  totalCredits: number;

  @Prop()
  programDuration: string;

  @Prop({ enum: DeliveryMode, default: DeliveryMode.ONSITE })
  deliveryMode: DeliveryMode;
}

export const MajorSchema = SchemaFactory.createForClass(Major);
