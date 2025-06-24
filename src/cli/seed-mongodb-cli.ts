import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campus } from '../entity/campus.entity';
import { Major } from '../entity/major.entity';
import { TuitionFee } from '../entity/tution-fees.entity';
import { Scholarship } from '../entity/scholarships.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { MongoDbDataService } from '@/mongo/mongo.service';

// Load environment variables
dotenv.config();

/**
 * CLI tool để seed dữ liệu từ JSON file vào MongoDB
 */
async function bootstrap() {
  console.log('🌱 Starting MongoDB seeding process...');
  console.log('📋 Configuration:');
  console.log('- MongoDB URI:', process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing');

  const app = await NestFactory.createApplicationContext(AppModule);

  // Get models directly
  const campusModel = app.get<Model<Campus>>('CampusModel');
  const majorModel = app.get<Model<Major>>('MajorModel');
  const tuitionFeeModel = app.get<Model<TuitionFee>>('TuitionFeeModel');
  const scholarshipModel = app.get<Model<Scholarship>>('ScholarshipModel');
  const mongoDbDataService = app.get(MongoDbDataService);

  try {
    // Check current data
    console.log('\n📊 Checking current MongoDB data...');
    const stats = await mongoDbDataService.getDataStatistics();
    console.log('Current data:', stats);

    if (stats.campuses > 0 || stats.majors > 0 || stats.tuitionFees > 0 || stats.scholarships > 0) {
      console.log('⚠️  Data already exists in MongoDB.');
      console.log('💡 Do you want to continue and potentially duplicate data? (Ctrl+C to cancel)');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Read JSON file
    const jsonFilePath = path.join(process.cwd(), 'documents', 'fpt_university_2025_data_v1_update.json');
    console.log(`\n📄 Reading JSON file: ${jsonFilePath}`);

    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`JSON file not found: ${jsonFilePath}`);
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    console.log('✅ JSON file loaded successfully');

    // Seed Campuses
    if (jsonData.campuses && jsonData.campuses.length > 0) {
      console.log(`\n🏫 Seeding ${jsonData.campuses.length} campuses...`);
      for (const campusData of jsonData.campuses) {
        try {
          const campus = new campusModel({
            name: campusData.Name,
            address: campusData.Address,
            contactInfo: campusData.ContactInfo,
            descriptionHighlights: campusData.DescriptionHighlights
          });
          await campus.save();
          console.log(`✅ Saved campus: ${campusData.Name}`);
        } catch (error) {
          if (error.code === 11000) { // Duplicate key error
            console.log(`⚠️  Campus already exists: ${campusData.Name}`);
          } else {
            console.error(`❌ Error saving campus ${campusData.Name}:`, error.message);
          }
        }
      }
    }

    // Seed Majors
    if (jsonData.majors && jsonData.majors.length > 0) {
      console.log(`\n🎓 Seeding ${jsonData.majors.length} majors...`);
      for (const majorData of jsonData.majors) {
        try {
          const major = new majorModel({
            name: majorData.Name,
            code: majorData.Code,
            description: majorData.Description,
            careerOpportunities: majorData.CareerOpportunities,
            generalAdmissionRequirements: majorData.GeneralAdmissionRequirements,
            totalCredits: majorData.TotalCredits,
            programDuration: majorData.ProgramDuration,
            deliveryMode: 'ONSITE' // Default value
          });
          await major.save();
          console.log(`✅ Saved major: ${majorData.Name} (${majorData.Code})`);
        } catch (error) {
          if (error.code === 11000) { // Duplicate key error
            console.log(`⚠️  Major already exists: ${majorData.Code}`);
          } else {
            console.error(`❌ Error saving major ${majorData.Code}:`, error.message);
          }
        }
      }
    }

    // Seed Tuition Fees
    if (jsonData.tuitionFees && jsonData.tuitionFees.length > 0) {
      console.log(`\n💰 Seeding ${jsonData.tuitionFees.length} tuition fees...`);
      for (const feeData of jsonData.tuitionFees) {
        try {
          // Find the major first
          const major = await majorModel.findOne({ code: feeData.MajorID });
          if (!major) {
            console.log(`⚠️  Major not found for tuition fee: ${feeData.MajorID}`);
            continue;
          }

          const tuitionFee = new tuitionFeeModel({
            major: major._id,
            semesterRange: feeData.SemesterRange,
            baseAmount: feeData.BaseAmount,
            currency: feeData.Currency || 'VND',
            effectiveFrom: new Date(),
            notes: feeData.Notes
          });
          await tuitionFee.save();
          console.log(`✅ Saved tuition fee: ${feeData.MajorID} - ${feeData.SemesterRange}`);
        } catch (error) {
          if (error.code === 11000) { // Duplicate key error
            console.log(`⚠️  Tuition fee already exists: ${feeData.MajorID} - ${feeData.SemesterRange}`);
          } else {
            console.error(`❌ Error saving tuition fee:`, error.message);
          }
        }
      }
    }

    // Seed Scholarships
    if (jsonData.scholarships && jsonData.scholarships.length > 0) {
      console.log(`\n🏆 Seeding ${jsonData.scholarships.length} scholarships...`);
      for (const scholarshipData of jsonData.scholarships) {
        try {
          const scholarship = new scholarshipModel({
            name: scholarshipData.Name,
            description: scholarshipData.Description,
            value: scholarshipData.Value,
            coverage: scholarshipData.Coverage || 'PARTIAL',
            requirements: scholarshipData.Requirements,
            applicationProcess: scholarshipData.ApplicationProcess,
            deadlineInfo: scholarshipData.DeadlineInfo,
            isActive: true
          });
          await scholarship.save();
          console.log(`✅ Saved scholarship: ${scholarshipData.Name}`);
        } catch (error) {
          console.error(`❌ Error saving scholarship ${scholarshipData.Name}:`, error.message);
        }
      }
    }

    // Final statistics
    console.log('\n📊 Final statistics:');
    const finalStats = await mongoDbDataService.getDataStatistics();
    console.log('✅ Seeding completed!', finalStats);

    console.log('\n🎉 MongoDB seeding completed successfully!');
    console.log('📝 Next steps:');
    console.log('1. Run: pnpm run ingest:mongodb');
    console.log('2. Run: pnpm start:dev');
    console.log('3. Test the chatbot!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check MongoDB connection in .env file');
    console.log('2. Ensure MongoDB service is running');
    console.log('3. Check if JSON file exists');
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Chạy ứng dụng
bootstrap();
