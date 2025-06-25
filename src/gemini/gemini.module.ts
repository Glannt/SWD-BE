import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigModule } from '../config/config.module';

// Import entities and schemas
import { Campus, CampusSchema } from '../entity/campus.entity';
import { Major, MajorSchema } from '../entity/major.entity';
import { TuitionFee, TuitionFeeSchema } from '../entity/tution-fees.entity';
import { Scholarship, ScholarshipSchema } from '../entity/scholarships.entity';
import { CampusDiscount, CampusDiscountSchema } from '../entity/campus-discounts.entity';
import { CampusMajor, CampusMajorSchema } from '../entity/campus-major.entity';
import { SchoolRankSubmission, SchoolRankSubmissionSchema } from '../entity/schoolrank-submissions.entity';
import { MajorAdmissionQuota, MajorAdmissionQuotaSchema } from '../entity/major-admisson-quotas.entity';
import { IntakeBatch, IntakeBatchSchema } from '../entity/intake-batches.entity';
import { EnglishLevel, EnglishLevelSchema } from '../entity/english-levels.entity';
import { ChatMessage, ChatMessageSchema } from '../entity/chat-message.entity';
import { ChatSession, ChatSessionSchema } from '../entity/chat-session.entity';
import { AdmissionYear, AdmissionYearSchema } from '../entity/admission-year.entity';
import { AdmissionPlan, AdmissionPlanSchema } from '../entity/admission-plans.entity';
import { MongoDbDataService } from '../mongo/mongo.service';
import { PineconeService } from '../pinecone/pinecone.service';
import { GeminiService } from './gemini.service';

@Module({
  imports: [
    ConfigModule,

  ],
  providers: [
    GeminiService,
  ],
  exports: [

    GeminiService,
  ],
})
export class GeminiModule {}
