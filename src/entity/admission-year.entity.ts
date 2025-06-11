import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'admission-years' })
export class AdmissionYear extends Document {
  @Prop({ required: true, unique: true })
  year: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  totalQuota: number;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ required: true })
  applicationOpenDate: Date;

  @Prop({ required: true })
  applicationCloseDate: Date;

  @Prop({ required: true })
  resultReleaseDate: Date;

  @Prop({ required: true })
  enrollmentDeadline: Date;
}

export const AdmissionYearSchema = SchemaFactory.createForClass(AdmissionYear);
