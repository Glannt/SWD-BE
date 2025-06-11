import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Campus } from './campus.entity';
import { Major } from './major.entity';
import { IntakeBatch } from './intake-batches.entity';
import { Types } from 'mongoose';

@Schema({ collection: 'campus-majors' })
export class CampusMajor extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Campus' })
  campus: Campus;

  @Prop({ type: Types.ObjectId, ref: 'Major' })
  major: Major;

  @Prop({ type: Types.ObjectId, ref: 'IntakeBatch' })
  batch: IntakeBatch;

  @Prop()
  specificAdmissionScoreInfo: string;

  @Prop()
  programDetailsURL: string;
}

export const CampusMajorSchema = SchemaFactory.createForClass(CampusMajor);
CampusMajorSchema.index({ campus: 1, major: 1, batch: 1 }, { unique: true });
