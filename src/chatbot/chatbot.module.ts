import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AskController } from './controllers/ask.controller';
import { SystemController } from './controllers/system.controller';
import { AskService } from './services/ask.service';
import { GeminiService } from './services/gemini.service';
import { PineconeService } from './services/pinecone.service';
import { IngestService } from './services/ingest.service';
import { MongoDbDataService } from './services/mongodb-data.service';
import { CacheService } from './services/cache.service';
import { ConfigModule } from '../config/config.module';

// Import entities and schemas
import { Campus, CampusSchema } from '../entity/campus.entity';
import { Major, MajorSchema } from '../entity/major.entity';
import { TuitionFee, TuitionFeeSchema } from '../entity/tution-fees.entity';
import { Scholarship, ScholarshipSchema } from '../entity/scholarships.entity';
import { CampusDiscount, CampusDiscountSchema } from '../entity/campus-discounts.entity';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Campus.name, schema: CampusSchema },
      { name: Major.name, schema: MajorSchema },
      { name: TuitionFee.name, schema: TuitionFeeSchema },
      { name: Scholarship.name, schema: ScholarshipSchema },
      { name: CampusDiscount.name, schema: CampusDiscountSchema },
    ]),
  ],
  controllers: [AskController, SystemController],
  providers: [
    AskService, 
    GeminiService, 
    PineconeService, 
    IngestService,
    MongoDbDataService,
    CacheService,
  ],
  exports: [
    AskService, 
    GeminiService, 
    PineconeService, 
    IngestService,
    MongoDbDataService,
  ],
})
export class ChatbotModule {} 