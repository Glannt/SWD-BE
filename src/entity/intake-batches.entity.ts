import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AdmissionYear } from './admission-year.entity';
import { Types } from 'mongoose';

@Schema({ collection: 'intakeBatches' })
export class IntakeBatch extends Document {
  @Prop({ type: Types.ObjectId, ref: 'AdmissionYear' })
  admissionYear: AdmissionYear;

  @Prop()
  name: string;

  @Prop({ default: true })
  isFixedTuition: boolean;

  @Prop()
  orientationFee: number;

  @Prop()
  applicationOpenDate: Date;

  @Prop()
  applicationCloseDate: Date;

  @Prop()
  orientationDate: Date;

  @Prop()
  semesterStartDate: Date;

  @Prop()
  semesterEndDate: Date;
}

export const IntakeBatchSchema = SchemaFactory.createForClass(IntakeBatch);
