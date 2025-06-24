import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './user.entity';
import { Types } from 'mongoose';
import { applySmartIdField } from '@/common/middleware/assign_custome_id.middleware';

@Schema({
  timestamps: { createdAt: 'submissionTimestamp' },
  collection: 'school-rank-submissions',
})
export class SchoolRankSubmission extends Document {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  provinceCity: string;

  // Required subjects
  @Prop({ required: true })
  grade_Toan_L11: number;

  @Prop({ required: true })
  grade_Toan_L12HK1: number;

  @Prop({ required: true })
  grade_NguVan_L11: number;

  @Prop({ required: true })
  grade_NguVan_L12HK1: number;

  // Optional subjects
  @Prop()
  grade_NgoaiNgu_L11: number;

  @Prop()
  grade_NgoaiNgu_L12HK1: number;

  @Prop()
  grade_HoaHoc_L11: number;

  @Prop()
  grade_HoaHoc_L12HK1: number;

  @Prop()
  grade_LichSu_L11: number;

  @Prop()
  grade_LichSu_L12HK1: number;

  @Prop()
  grade_CongNghe_L11: number;

  @Prop()
  grade_CongNghe_L12HK1: number;

  @Prop()
  grade_GD_KTPL_L11: number;

  @Prop()
  grade_GD_KTPL_L12HK1: number;

  @Prop()
  grade_VatLy_L11: number;

  @Prop()
  grade_VatLy_L12HK1: number;

  @Prop()
  grade_SinhHoc_L11: number;

  @Prop()
  grade_SinhHoc_L12HK1: number;

  @Prop()
  grade_DiaLy_L11: number;

  @Prop()
  grade_DiaLy_L12HK1: number;

  @Prop()
  grade_TinHoc_L11: number;

  @Prop()
  grade_TinHoc_L12HK1: number;

  // Ranking results
  @Prop()
  calculatedRankScore: number;

  @Prop()
  rankCategory: string;

  @Prop()
  isFirstGeneration: boolean;

  @Prop()
  processingNotes: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: User;
}

export const SchoolRankSubmissionSchema =
  SchemaFactory.createForClass(SchoolRankSubmission);

  applySmartIdField(SchoolRankSubmissionSchema, SchoolRankSubmission.name, 'school_rank_submission_id');