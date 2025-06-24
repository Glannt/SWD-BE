import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DataSeedService } from './data-seed.service';
import { DataSeedController } from '../controllers/data-seed.controller';

// Import all entities and schemas
import { Campus, CampusSchema } from '../../entity/campus.entity';
import { Major, MajorSchema } from '../../entity/major.entity';
import { TuitionFee, TuitionFeeSchema } from '../../entity/tution-fees.entity';
import { Scholarship, ScholarshipSchema } from '../../entity/scholarships.entity';
import { CampusDiscount, CampusDiscountSchema } from '../../entity/campus-discounts.entity';
import { AdmissionPlan, AdmissionPlanSchema } from '../../entity/admission-plans.entity';
import { AdmissionYear, AdmissionYearSchema } from '../../entity/admission-year.entity';
import { CampusMajor, CampusMajorSchema } from '../../entity/campus-major.entity';
import { EnglishLevel, EnglishLevelSchema } from '../../entity/english-levels.entity';
import { IntakeBatch, IntakeBatchSchema } from '../../entity/intake-batches.entity';
import { MajorAdmissionQuota, MajorAdmissionQuotaSchema } from '../../entity/major-admisson-quotas.entity';
import { User, UserSchema } from '../../entity/user.entity';
import { CampusModule } from '../../campus/campus.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campus.name, schema: CampusSchema },
      { name: Major.name, schema: MajorSchema },
      { name: TuitionFee.name, schema: TuitionFeeSchema },
      { name: Scholarship.name, schema: ScholarshipSchema },
      { name: CampusDiscount.name, schema: CampusDiscountSchema },
      { name: AdmissionPlan.name, schema: AdmissionPlanSchema },
      { name: AdmissionYear.name, schema: AdmissionYearSchema },
      { name: CampusMajor.name, schema: CampusMajorSchema },
      { name: EnglishLevel.name, schema: EnglishLevelSchema },
      { name: IntakeBatch.name, schema: IntakeBatchSchema },
      { name: MajorAdmissionQuota.name, schema: MajorAdmissionQuotaSchema },
      { name: User.name, schema: UserSchema },
    ]),
    CampusModule,
  ],
  controllers: [DataSeedController],
  providers: [DataSeedService],
  exports: [DataSeedService],
})
export class DataSeedModule {}
