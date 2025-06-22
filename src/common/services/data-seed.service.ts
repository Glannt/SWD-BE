import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Import entities
import { Campus } from '../../entity/campus.entity';
import { Major } from '../../entity/major.entity';
import { TuitionFee } from '../../entity/tution-fees.entity';
import { Scholarship } from '../../entity/scholarships.entity';
import { CampusDiscount } from '../../entity/campus-discounts.entity';
import { AdmissionPlan } from '../../entity/admission-plans.entity';
import { AdmissionYear } from '../../entity/admission-year.entity';
import { CampusMajor } from '../../entity/campus-major.entity';
import { EnglishLevel } from '../../entity/english-levels.entity';
import { IntakeBatch } from '../../entity/intake-batches.entity';
import { MajorAdmissionQuota } from '../../entity/major-admisson-quotas.entity';
import { User } from '../../entity/user.entity';

@Injectable()
export class DataSeedService {
  private readonly logger = new Logger(DataSeedService.name);
  private readonly documentsPath = path.join(process.cwd(), 'documents');

  constructor(
    @InjectModel(Campus.name) private campusModel: Model<Campus>,
    @InjectModel(Major.name) private majorModel: Model<Major>,
    @InjectModel(TuitionFee.name) private tuitionFeeModel: Model<TuitionFee>,
    @InjectModel(Scholarship.name) private scholarshipModel: Model<Scholarship>,
    @InjectModel(CampusDiscount.name) private campusDiscountModel: Model<CampusDiscount>,
    @InjectModel(AdmissionPlan.name) private admissionPlanModel: Model<AdmissionPlan>,
    @InjectModel(AdmissionYear.name) private admissionYearModel: Model<AdmissionYear>,
    @InjectModel(CampusMajor.name) private campusMajorModel: Model<CampusMajor>,
    @InjectModel(EnglishLevel.name) private englishLevelModel: Model<EnglishLevel>,
    @InjectModel(IntakeBatch.name) private intakeBatchModel: Model<IntakeBatch>,
    @InjectModel(MajorAdmissionQuota.name) private majorAdmissionQuotaModel: Model<MajorAdmissionQuota>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Kiểm tra và seed dữ liệu tự động khi khởi động ứng dụng
   */
  async checkAndSeedData(): Promise<void> {
    try {
      this.logger.log('🔍 Checking database data availability...');
      
      // Kiểm tra các collection chính
      const dataStatus = await this.checkDataStatus();
      
      if (dataStatus.needsSeeding) {
        this.logger.log('📦 Database is empty or incomplete. Starting auto-seed process...');
        await this.seedAllData();
        this.logger.log('✅ Auto-seed completed successfully!');
      } else {
        this.logger.log('✅ Database already contains data. Skipping seed process.');
        this.logger.log(`📊 Current data counts: ${JSON.stringify(dataStatus.counts)}`);
      }
    } catch (error) {
      this.logger.error('❌ Error during auto-seed check:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra trạng thái dữ liệu trong database
   */
  private async checkDataStatus(): Promise<{
    needsSeeding: boolean;
    counts: Record<string, number>;
  }> {
    const counts = {
      campuses: await this.campusModel.countDocuments(),
      majors: await this.majorModel.countDocuments(),
      tuitionFees: await this.tuitionFeeModel.countDocuments(),
      scholarships: await this.scholarshipModel.countDocuments(),
      campusDiscounts: await this.campusDiscountModel.countDocuments(),
      admissionPlans: await this.admissionPlanModel.countDocuments(),
      admissionYears: await this.admissionYearModel.countDocuments(),
      campusMajors: await this.campusMajorModel.countDocuments(),
      englishLevels: await this.englishLevelModel.countDocuments(),
      intakeBatches: await this.intakeBatchModel.countDocuments(),
      majorAdmissionQuotas: await this.majorAdmissionQuotaModel.countDocuments(),
    };

    // Kiểm tra nếu các collection chính còn trống
    const mainCollections = ['campuses', 'majors', 'scholarships'];
    const needsSeeding = mainCollections.some(collection => counts[collection] === 0);

    return { needsSeeding, counts };
  }

  /**
   * Seed tất cả dữ liệu từ JSON files
   */
  private async seedAllData(): Promise<void> {
    const seedTasks = [
      { name: 'Campuses', file: 'FchatCareer.campuses.json', method: this.seedCampuses.bind(this) },
      { name: 'Majors', file: 'FchatCareer.majors.json', method: this.seedMajors.bind(this) },
      { name: 'Scholarships', file: 'FchatCareer.scholarships.json', method: this.seedScholarships.bind(this) },
      { name: 'Campus Discounts', file: 'FchatCareer.campusDiscounts.json', method: this.seedCampusDiscounts.bind(this) },
      { name: 'Admission Plans', file: 'FchatCareer.admissionPlans.json', method: this.seedAdmissionPlans.bind(this) },
      { name: 'Admission Years', file: 'FchatCareer.admissionYears.json', method: this.seedAdmissionYears.bind(this) },
      { name: 'Campus Majors', file: 'FchatCareer.campusMajors.json', method: this.seedCampusMajors.bind(this) },
      { name: 'English Levels', file: 'FchatCareer.englishLevels.json', method: this.seedEnglishLevels.bind(this) },
      { name: 'Intake Batches', file: 'FchatCareer.intakeBatches.json', method: this.seedIntakeBatches.bind(this) },
      { name: 'Major Admission Quotas', file: 'FchatCareer.majorAdmissionQuotas.json', method: this.seedMajorAdmissionQuotas.bind(this) },
      { name: 'Tuition Fees', file: 'FchatCareer.tuitionFees.json', method: this.seedTuitionFees.bind(this) },
    ];

    for (const task of seedTasks) {
      try {
        const filePath = path.join(this.documentsPath, task.file);
        if (fs.existsSync(filePath)) {
          this.logger.log(`📄 Seeding ${task.name}...`);
          await task.method(filePath);
          this.logger.log(`✅ ${task.name} seeded successfully`);
        } else {
          this.logger.warn(`⚠️ File not found: ${task.file} - Skipping ${task.name}`);
        }
      } catch (error) {
        this.logger.error(`❌ Error seeding ${task.name}:`, error);
        // Continue with other seeds even if one fails
      }
    }
  }

  /**
   * Seed campuses data
   */
  private async seedCampuses(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const campuses = jsonData.map(item => ({
      name: item.Name,
      address: item.Address,
      contactInfo: item.ContactInfo,
      descriptionHighlights: item.DescriptionHighlights,
    }));

    await this.campusModel.insertMany(campuses, { ordered: false });
    this.logger.log(`📊 Inserted ${campuses.length} campuses`);
  }

  /**
   * Seed majors data
   */
  private async seedMajors(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const majors = jsonData.map(item => ({
      name: item.Name,
      code: item.Code,
      description: item.Description,
      careerOpportunities: item.CareerOpportunities,
      generalAdmissionRequirements: item.GeneralAdmissionRequirements,
      totalCredits: item.TotalCredits,
      programDuration: item.ProgramDuration,
      deliveryMode: item.DeliveryMode,
    }));

    await this.majorModel.insertMany(majors, { ordered: false });
    this.logger.log(`📊 Inserted ${majors.length} majors`);
  }

  /**
   * Seed scholarships data
   */
  private async seedScholarships(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const scholarships = jsonData.map(item => ({
      name: item.Name,
      description: item.Description,
      value: item.Value,
      coverage: item.Coverage,
      requirements: item.Requirements,
      applicationProcess: item.ApplicationProcess,
      deadlineInfo: item.DeadlineInfo,
      isActive: item.IsActive !== false,
      totalSlots: item.TotalSlots,
      maintenanceCondition: item.MaintenanceCondition,
      startDate: item.StartDate ? new Date(item.StartDate) : undefined,
      endDate: item.EndDate ? new Date(item.EndDate) : undefined,
    }));

    await this.scholarshipModel.insertMany(scholarships, { ordered: false });
    this.logger.log(`📊 Inserted ${scholarships.length} scholarships`);
  }

  /**
   * Seed campus discounts data
   */
  private async seedCampusDiscounts(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const discounts = jsonData.map(item => ({
      name: item.Name,
      discountType: item.DiscountType,
      discountValue: item.DiscountValue,
      description: item.Description,
      isActive: item.IsActive !== false,
      startDate: item.StartDate ? new Date(item.StartDate) : undefined,
      endDate: item.EndDate ? new Date(item.EndDate) : undefined,
    }));

    await this.campusDiscountModel.insertMany(discounts, { ordered: false });
    this.logger.log(`📊 Inserted ${discounts.length} campus discounts`);
  }

  /**
   * Seed admission plans data
   */
  private async seedAdmissionPlans(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const plans = jsonData.map(item => ({
      name: item.Name,
      description: item.Description,
      requirements: item.Requirements,
      timeline: item.Timeline,
      isActive: item.IsActive !== false,
    }));

    await this.admissionPlanModel.insertMany(plans, { ordered: false });
    this.logger.log(`📊 Inserted ${plans.length} admission plans`);
  }

  /**
   * Seed admission years data
   */
  private async seedAdmissionYears(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const years = jsonData.map(item => ({
      year: item.Year,
      isActive: item.IsActive !== false,
      startDate: item.StartDate ? new Date(item.StartDate) : undefined,
      endDate: item.EndDate ? new Date(item.EndDate) : undefined,
    }));

    await this.admissionYearModel.insertMany(years, { ordered: false });
    this.logger.log(`📊 Inserted ${years.length} admission years`);
  }

  /**
   * Seed campus majors data
   */
  private async seedCampusMajors(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Note: This requires proper mapping of Campus and Major IDs
    // We'll implement this after we have the referenced data
    this.logger.log(`⚠️ Campus Majors seeding requires ID mapping - implementing simple version`);
    this.logger.log(`📊 Found ${jsonData.length} campus major records`);
  }

  /**
   * Seed english levels data
   */
  private async seedEnglishLevels(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const levels = jsonData.map(item => ({
      level: item.Level,
      description: item.Description,
      requirements: item.Requirements,
      isActive: item.IsActive !== false,
    }));

    await this.englishLevelModel.insertMany(levels, { ordered: false });
    this.logger.log(`📊 Inserted ${levels.length} english levels`);
  }

  /**
   * Seed intake batches data
   */
  private async seedIntakeBatches(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const batches = jsonData.map(item => ({
      name: item.Name,
      year: item.Year,
      semester: item.Semester,
      startDate: item.StartDate ? new Date(item.StartDate) : undefined,
      endDate: item.EndDate ? new Date(item.EndDate) : undefined,
      isActive: item.IsActive !== false,
    }));

    await this.intakeBatchModel.insertMany(batches, { ordered: false });
    this.logger.log(`📊 Inserted ${batches.length} intake batches`);
  }

  /**
   * Seed major admission quotas data
   */
  private async seedMajorAdmissionQuotas(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Note: This requires proper mapping of Major IDs
    this.logger.log(`⚠️ Major Admission Quotas seeding requires ID mapping - implementing simple version`);
    this.logger.log(`📊 Found ${jsonData.length} major admission quota records`);
  }

  /**
   * Seed tuition fees data
   */
  private async seedTuitionFees(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Create mapping dictionaries for Major and Batch references
    const majors = await this.majorModel.find().exec();
    const batches = await this.intakeBatchModel.find().exec();
    
    const majorIdMap = new Map();
    majors.forEach((major, index) => {
      majorIdMap.set(index + 1, major._id); // Assuming MajorID starts from 1
    });
    
    const batchIdMap = new Map();
    batches.forEach((batch, index) => {
      batchIdMap.set(index + 1, batch._id); // Assuming BatchID starts from 1
    });
    
    const tuitionFees = jsonData
      .filter(item => majorIdMap.has(item.MajorID) && batchIdMap.has(item.BatchID))
      .map(item => ({
        major: majorIdMap.get(item.MajorID),
        batch: batchIdMap.get(item.BatchID),
        semesterRange: item.SemesterRange,
        baseAmount: item.BaseAmount,
        isInclusive: item.IsInclusive,
        currency: item.Currency,
        effectiveFrom: new Date(item.EffectiveFrom),
        effectiveTo: item.EffectiveTo ? new Date(item.EffectiveTo) : undefined,
        includesMaterials: item.IncludesMaterials,
        notes: item.Notes,
      }));

    if (tuitionFees.length > 0) {
      await this.tuitionFeeModel.insertMany(tuitionFees, { ordered: false });
      this.logger.log(`📊 Inserted ${tuitionFees.length} tuition fees`);
    } else {
      this.logger.warn(`⚠️ No valid tuition fees found (missing major/batch references)`);
    }
  }

  /**
   * Get seeding status for health check
   */
  async getSeedingStatus(): Promise<{
    isSeeded: boolean;
    collections: Record<string, number>;
    lastCheck: Date;
  }> {
    const status = await this.checkDataStatus();
    return {
      isSeeded: !status.needsSeeding,
      collections: status.counts,
      lastCheck: new Date(),
    };
  }
} 