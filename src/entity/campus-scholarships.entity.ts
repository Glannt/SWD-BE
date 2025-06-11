import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Campus } from './campus.entity';
import { Scholarship } from './scholarships.entity';
import { Types } from 'mongoose';

@Schema({ collection: 'campus-scholarships' })
export class CampusScholarship extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Campus' })
  campus: Campus;

  @Prop({ type: Types.ObjectId, ref: 'Scholarship' })
  scholarship: Scholarship;

  @Prop()
  additionalRequirements: string;

  @Prop()
  specificValueInfo: string;

  @Prop()
  contactPerson: string;

  @Prop()
  slotsAvailable: number;

  @Prop()
  validFrom: Date;

  @Prop()
  validTo: Date;
}

export const CampusScholarshipSchema =
  SchemaFactory.createForClass(CampusScholarship);
CampusScholarshipSchema.index({ campus: 1, scholarship: 1 }, { unique: true });
