import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Major } from './major.entity';
import { AdmissionYear } from './admission-year.entity';
import { Campus } from './campus.entity';
import { Types } from 'mongoose';
import { applySmartIdField } from '../common/middleware/assign_custome_id.middleware';

@Schema({ timestamps: true, collection: 'majorAdmissionQuotas' })
export class MajorAdmissionQuota extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Major' })
  major: Major;

  @Prop({ type: Types.ObjectId, ref: 'AdmissionYear' })
  admissionYear: AdmissionYear;

  @Prop({ type: Types.ObjectId, ref: 'Campus' })
  campus: Campus;

  @Prop({ required: true })
  quota: number;

  @Prop({ default: 0 })
  registeredStudents: number;
}

export const MajorAdmissionQuotaSchema =
  SchemaFactory.createForClass(MajorAdmissionQuota);
MajorAdmissionQuotaSchema.index(
  { major: 1, admissionYear: 1, campus: 1 },
  { unique: true },
);

applySmartIdField(MajorAdmissionQuotaSchema, MajorAdmissionQuota.name, 'major_admission_quota_id');
