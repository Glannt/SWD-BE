import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { EnglishLevel, EnglishLevelSchema } from '../../entity/english-levels.entity';
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
    // Thứ tự seed theo dependency:
    // 1. Các bảng độc lập (không có foreign key)
    // 2. Các bảng có foreign key (cần reference đến bảng độc lập)

    const seedTasks = [
      // === BẢNG ĐỘC LẬP (SEED TRƯỚC) ===
      { name: 'Campuses', file: 'FchatCareer.campuses.json', method: this.seedCampuses.bind(this) },
      { name: 'Majors', file: 'FchatCareer.majors.json', method: this.seedMajors.bind(this) },
      { name: 'Admission Years', file: 'FchatCareer.admissionYears.json', method: this.seedAdmissionYears.bind(this) },
      { name: 'Intake Batches', file: 'FchatCareer.intakeBatches.json', method: this.seedIntakeBatches.bind(this) },
      { name: 'Scholarships', file: 'FchatCareer.scholarships.json', method: this.seedScholarships.bind(this) },
      { name: 'English Levels', file: 'FchatCareer.englishLevels.json', method: this.seedEnglishLevels.bind(this) },

      // === BẢNG CÓ FOREIGN KEY (SEED SAU) ===
      { name: 'Campus Discounts', file: 'FchatCareer.campusDiscounts.json', method: this.seedCampusDiscounts.bind(this) },
      { name: 'Admission Plans', file: 'FchatCareer.admissionPlans.json', method: this.seedAdmissionPlans.bind(this) },
      { name: 'Campus Majors', file: 'FchatCareer.campusMajors.json', method: this.seedCampusMajors.bind(this) },
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
    const campuses = jsonData.map((item: any, index: number) => ({
      campusId: index + 1, // Tạo ID số để reference
      name: item.Name,
      address: item.Address,
      contactInfo: item.ContactInfo,
      descriptionHighlights: item.DescriptionHighlights,
    }));

    const docs = campuses.map(item => ({
      ...item,
      campus_id: new Types.ObjectId().toString()
    }));

    await this.campusModel.insertMany(docs, { ordered: false });
    this.logger.log(`📊 Inserted ${campuses.length} campuses`);
  }

  /**
   * Seed majors data
   */
  private async seedMajors(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Loại bỏ duplicate records dựa trên code
    const uniqueCodes = new Set();
    const majors = jsonData
      .filter((item: any, index: number) => {
        const code = item.Code;

        if (uniqueCodes.has(code)) {
          return false; // Skip duplicate
        }

        uniqueCodes.add(code);
        return true;
      })
      .map((item: any, index: number) => ({
        majorId: index + 1, // Tạo ID số để reference
        name: item.Name,
        code: item.Code,
        description: item.Description,
        careerOpportunities: item.CareerOpportunities,
        generalAdmissionRequirements: item.GeneralAdmissionRequirements,
        totalCredits: item.TotalCredits,
        programDuration: item.ProgramDuration,
        deliveryMode: item.DeliveryMode,
      }));

    const docs = majors.map(item => ({
      ...item,
      major_id: new Types.ObjectId().toString()
    }));

    await this.majorModel.insertMany(docs, { ordered: false });
    this.logger.log(`📊 Inserted ${majors.length} majors (removed ${jsonData.length - majors.length} duplicates)`);
  }

  /**
   * Seed scholarships data
   */
  private async seedScholarships(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const scholarships = jsonData.map((item: any, index: number) => ({
      scholarshipId: index + 1, // Tạo ID số để reference
      name: item.name,
      description: item.description,
      value: item.value,
      coverage: item.coverage,
      requirements: item.requirements,
      applicationProcess: item.applicationProcess,
      deadlineInfo: item.deadlineInfo,
      isActive: item.IsActive !== false,
      totalSlots: item.totalSlots || "",
      maintenanceCondition: item.maintenanceCondition || "",
      startDate: item.StartDate ? new Date(item.StartDate) : undefined,
      endDate: item.EndDate ? new Date(item.EndDate) : undefined,
    }));

    const docs = scholarships.map(item => ({
      ...item,
      scholarship_id: new Types.ObjectId().toString()
    }));

    await this.scholarshipModel.insertMany(docs, { ordered: false });
    this.logger.log(`📊 Inserted ${scholarships.length} scholarships`);
  }

  /**
   * Seed campus discounts data
   */
  private async seedCampusDiscounts(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Lấy danh sách campus và batch để map ID
    const campuses = await this.campusModel.find().exec();
    const batches = await this.intakeBatchModel.find().exec();

    const campusIdMap = new Map();
    campuses.forEach((campus: any) => {
      campusIdMap.set(campus.campusId, campus._id);
    });

    const batchIdMap = new Map();
    batches.forEach((batch: any) => {
      batchIdMap.set(batch.batchId, batch._id);
    });

    // Loại bỏ duplicate records dựa trên campus-batch combination
    const uniqueCombinations = new Set();
    const discounts = jsonData
      .filter((item: any) => {
        if (!campusIdMap.has(item.campusId) || !batchIdMap.has(item.batchId)) {
          return false;
        }

        // Tạo key unique cho combination
        const campusId = campusIdMap.get(item.campusId);
        const batchId = batchIdMap.get(item.batchId);
        const combinationKey = `${campusId}-${batchId}`;

        if (uniqueCombinations.has(combinationKey)) {
          return false; // Skip duplicate
        }

        uniqueCombinations.add(combinationKey);
        return true;
      })
      .map((item: any) => ({
        campus: campusIdMap.get(item.campusId),
        batch: batchIdMap.get(item.batchId),
        discountName: item.discountName,
        discountType: item.discountType,
        discountValue: item.discountValue,
        conditions: item.conditions,
        startDate: item.startDate ? new Date(item.startDate) : undefined,
        endDate: item.endDate ? new Date(item.endDate) : undefined,
        validFrom: item.validFrom ? new Date(item.validFrom) : undefined,
        validTo: item.validTo ? new Date(item.validTo) : undefined,
        description: item.description,
      }));

    if (discounts.length > 0) {
      const docs = discounts.map(item => ({
        ...item,
        campus_discount_id: new Types.ObjectId().toString()
      }));

      await this.campusDiscountModel.insertMany(docs, { ordered: false });
      this.logger.log(`📊 Inserted ${discounts.length} campus discounts (removed ${jsonData.length - discounts.length} duplicates)`);
    } else {
      this.logger.warn(`⚠️ No valid campus discounts found (missing campus/batch references)`);
    }
  }

  /**
   * Seed admission plans data
   */
  private async seedAdmissionPlans(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Lấy danh sách admission years để map ID
    const admissionYears = await this.admissionYearModel.find().exec();

    const admissionYearIdMap = new Map();
    admissionYears.forEach((year: any) => {
      admissionYearIdMap.set(year.admissionYearId, year._id);
    });

    const plans = jsonData
      .filter((item: any) => admissionYearIdMap.has(item.admissionYearId))
      .map((item: any) => ({
        admissionYear: admissionYearIdMap.get(item.admissionYearId),
        planName: item.planName || '',
        description: item.description || '',
        method: item.method || '',
        startDate: item.startDate ? new Date(item.startDate) : undefined,
        endDate: item.endDate ? new Date(item.endDate) : undefined,
      }));

    if (plans.length > 0) {
      const docs = plans.map(item => ({
        ...item,
        admission_plan_id: new Types.ObjectId().toString()
      }));

      await this.admissionPlanModel.insertMany(docs, { ordered: false });
      this.logger.log(`📊 Inserted ${plans.length} admission plans`);
    } else {
      this.logger.warn(`⚠️ No valid admission plans found (missing admission year references)`);
    }
  }

  /**
   * Seed admission years data
   */
  private async seedAdmissionYears(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const years = jsonData.map((item: any, index: number) => ({
      admissionYearId: item.AdmissionYearID || index + 1, // Sử dụng ID từ JSON hoặc tạo mới
      year: item.Year,
      startDate: item.StartDate ? new Date(item.StartDate) : undefined,
      endDate: item.EndDate ? new Date(item.EndDate) : undefined,
      totalQuota: item.TotalQuota,
      isActive: item.IsActive !== false,
      applicationOpenDate: item.ApplicationOpenDate ? new Date(item.ApplicationOpenDate) : undefined,
      applicationCloseDate: item.ApplicationCloseDate ? new Date(item.ApplicationCloseDate) : undefined,
      resultReleaseDate: item.ResultReleaseDate ? new Date(item.ResultReleaseDate) : undefined,
      enrollmentDeadline: item.EnrollmentDeadline ? new Date(item.EnrollmentDeadline) : undefined,
    }));

    const docs = years.map(item => ({
      ...item,
      admission_year_id: new Types.ObjectId().toString()
    }));

    await this.admissionYearModel.insertMany(docs, { ordered: false });
    this.logger.log(`📊 Inserted ${years.length} admission years`);
  }

  /**
   * Seed campus majors data
   */
  private async seedCampusMajors(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Lấy danh sách campus và major để map ID
    const campuses = await this.campusModel.find().exec();
    const majors = await this.majorModel.find().exec();

    const campusIdMap = new Map();
    campuses.forEach((campus: any) => {
      campusIdMap.set(campus.campusId, campus._id);
    });

    const majorIdMap = new Map();
    majors.forEach((major: any) => {
      majorIdMap.set(major.majorId, major._id);
    });

    // Loại bỏ duplicate records dựa trên campus-major-batch combination
    const uniqueCombinations = new Set();
    const uniqueCampusMajors = jsonData
      .filter((item: any) => {
        if (!campusIdMap.has(item.campusId) || !majorIdMap.has(item.majorId)) {
          return false;
        }

        // Tạo key unique cho combination
        const campusId = campusIdMap.get(item.campusId);
        const majorId = majorIdMap.get(item.majorId);
        const batchId = item.batchId ? item.batchId : 'null';
        const combinationKey = `${campusId}-${majorId}-${batchId}`;

        if (uniqueCombinations.has(combinationKey)) {
          return false; // Skip duplicate
        }

        uniqueCombinations.add(combinationKey);
        return true;
      })
      .map((item: any) => ({
        campus: campusIdMap.get(item.campusId),
        major: majorIdMap.get(item.majorId),
        batch: item.batchId ? item.batchId : null, // Đảm bảo batch không undefined
        specificAdmissionScoreInfo: item.specificAdmissionScoreInfo || '',
        programDetailsURL: item.programDetailsURL || '',
      }));

    if (uniqueCampusMajors.length > 0) {
      const docs = uniqueCampusMajors.map(item => ({
        ...item,
        campus_major_id: new Types.ObjectId().toString()
      }));

      await this.campusMajorModel.insertMany(docs, { ordered: false });
      this.logger.log(`📊 Inserted ${uniqueCampusMajors.length} campus majors (removed ${jsonData.length - uniqueCampusMajors.length} duplicates)`);
    } else {
      this.logger.warn(`⚠️ No valid campus majors found (missing campus/major references)`);
    }
  }

  /**
   * Seed intake batches data
   */
  private async seedIntakeBatches(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const batches = jsonData.map((item: any, index: number) => ({
      batchId: index + 1, // Tạo ID số để reference
      name: item.Name,
      year: item.Year,
      semester: item.Semester,
      startDate: item.StartDate ? new Date(item.StartDate) : undefined,
      endDate: item.EndDate ? new Date(item.EndDate) : undefined,
      isActive: item.IsActive !== false,
    }));

    const docs = batches.map(item => ({
      ...item,
      intake_batch_id: new Types.ObjectId().toString()
    }));

    await this.intakeBatchModel.insertMany(docs, { ordered: false });
    this.logger.log(`📊 Inserted ${batches.length} intake batches`);
  }

  /**
   * Seed english levels data
   */
  private async seedEnglishLevels(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Loại bỏ duplicate records dựa trên batch-levelNumber combination
    const uniqueCombinations = new Set();
    const levels = jsonData
      .filter((item: any, index: number) => {
        // Tạo key unique cho combination
        const batchId = item.batchId || 'null';
        const levelNumber = item.LevelNumber;
        const combinationKey = `${batchId}-${levelNumber}`;

        if (uniqueCombinations.has(combinationKey)) {
          return false; // Skip duplicate
        }

        uniqueCombinations.add(combinationKey);
        return true;
      })
      .map((item: any, index: number) => ({
        englishLevelId: index + 1, // Tạo ID số để reference
        levelNumber: item.LevelNumber,
        feeAmount: item.FeeAmount,
        description: item.Description,
        maxLevel: item.MaxLevel,
        batch: item.batchId || null, // Đảm bảo batch không undefined
      }));

    const docs = levels.map(item => ({
      ...item,
      english_level_id: new Types.ObjectId().toString()
    }));

    await this.englishLevelModel.insertMany(docs, { ordered: false });
    this.logger.log(`📊 Inserted ${levels.length} english levels (removed ${jsonData.length - levels.length} duplicates)`);
  }

  /**
   * Seed major admission quotas data
   */
  private async seedMajorAdmissionQuotas(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Lấy danh sách major và admission year để map ID
    const majors = await this.majorModel.find().exec();
    const admissionYears = await this.admissionYearModel.find().exec();

    const majorIdMap = new Map();
    majors.forEach((major: any) => {
      majorIdMap.set(major.majorId, major._id);
    });

    const admissionYearIdMap = new Map();
    admissionYears.forEach((year: any) => {
      admissionYearIdMap.set(year.admissionYearId, year._id);
    });

    const quotas = jsonData
      .filter((item: any) => majorIdMap.has(item.majorId) && admissionYearIdMap.has(item.admissionYearId))
      .map((item: any) => ({
        major: majorIdMap.get(item.majorId),
        admissionYear: admissionYearIdMap.get(item.admissionYearId),
        quota: item.quota,
        isActive: item.isActive !== false,
        startDate: item.startDate ? new Date(item.startDate) : undefined,
        endDate: item.endDate ? new Date(item.endDate) : undefined,
      }));

    if (quotas.length > 0) {
      const docs = quotas.map(item => ({
        ...item,
        major_admission_quota_id: new Types.ObjectId().toString()
      }));

      await this.majorAdmissionQuotaModel.insertMany(docs, { ordered: false });
      this.logger.log(`📊 Inserted ${quotas.length} major admission quotas`);
    } else {
      this.logger.warn(`⚠️ No valid major admission quotas found (missing major/admission year references)`);
    }
  }

  /**
   * Seed tuition fees data
   */
  private async seedTuitionFees(filePath: string): Promise<void> {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    this.logger.log(`📄 Found ${jsonData.length} tuition fees in JSON`);

    // Log từng item trong JSON để debug
    jsonData.forEach((item: any, index: number) => {
      this.logger.log(`📄 JSON item ${index}:`, {
        majorId: item.majorId,
        batchId: item.batchId,
        semesterRange: item.semesterRange,
        baseAmount: item.baseAmount
      });
    });

    // Lấy danh sách major và batch để map ID
    const majors = await this.majorModel.find().exec();
    const batches = await this.intakeBatchModel.find().exec();

    this.logger.log(`📄 Found ${majors.length} majors in DB`);
    this.logger.log(`📄 Found ${batches.length} batches in DB`);

    // Log tất cả majors trong DB
    majors.forEach((major: any, index: number) => {
      this.logger.log(`📄 DB major ${index + 1}:`, {
        _id: major._id,
        majorId: major.majorId || "",
        name: major.name
      });
    });

    // Log tất cả batches trong DB
    batches.forEach((batch: any, index: number) => {
      this.logger.log(`📄 DB batch ${index + 1}:`, {
        _id: batch._id,
        batchId: batch.batchId || "",
        name: batch.name
      });
    });

    // Map theo index từ 1 (majorId 1 = majors[0], majorId 2 = majors[1], etc.)
    const majorIdMap = new Map();
    majors.forEach((major: any, index: number) => {
      const majorId = index + 1; // Index từ 1
      majorIdMap.set(majorId, major._id);
      this.logger.log(`📄 Mapping majorId ${majorId} -> ${major._id} (${major.name})`);
    });

    const batchIdMap = new Map();
    batches.forEach((batch: any, index: number) => {
      const batchId = index + 1; // Index từ 1
      batchIdMap.set(batchId, batch._id);
      this.logger.log(`📄 Mapping batchId ${batchId} -> ${batch._id} (${batch.name})`);
    });

    const tuitionFees = jsonData
      // .filter((item: any) => {
      //   const hasMajor = majorIdMap.has(item.majorId);
      //   const hasBatch = batchIdMap.has(item.batchId);

      //   this.logger.log(`📄 Checking item: majorId=${item.majorId}, batchId=${item.batchId}, hasMajor=${hasMajor}, hasBatch=${hasBatch}`);

      //   if (!hasMajor) {
      //     this.logger.warn(`⚠️ Tuition fee has invalid majorId: ${item.majorId}`);
      //   }
      //   if (!hasBatch) {
      //     this.logger.warn(`⚠️ Tuition fee has invalid batchId: ${item.batchId}`);
      //   }

      //   return hasMajor && hasBatch;
      // })
      .map((item: any) => {
        const mappedItem = {
          major: majorIdMap.get(item.majorId),
          batch: batchIdMap.get(item.batchId),
          semesterRange: item.semesterRange || '',
          baseAmount: item.baseAmount || 0,
          isInclusive: item.isInclusive !== false,
          currency: item.currency || 'VND',
          effectiveFrom: item.effectiveFrom ? new Date(item.effectiveFrom) : new Date(),
          effectiveTo: item.effectiveTo ? new Date(item.effectiveTo) : undefined,
          includesMaterials: item.includesMaterials !== false,
          notes: item.notes || '',
        };
        this.logger.log(`📄 Mapped item:`, mappedItem);
        return mappedItem;
      });

    // Filter duplicates dựa trên major, batch
    const uniqueTuitionFees = [];
    const seenKeys = new Set();

    tuitionFees.forEach((item: any) => {
      const key = `${item.major}_${item.batch}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueTuitionFees.push(item);
      } else {
        this.logger.warn(`⚠️ Skipped duplicate: major=${item.major}, batch=${item.batch}, semesterRange="${item.semesterRange}", baseAmount=${item.baseAmount}`);
      }
    });

    this.logger.log(`📄 Filtered to ${uniqueTuitionFees.length} unique tuition fees (removed ${tuitionFees.length - uniqueTuitionFees.length} duplicates)`);

    if (uniqueTuitionFees.length > 0) {
      const docs = uniqueTuitionFees.map(item => ({
        ...item,
        tuition_fee_id: new Types.ObjectId().toString()
      }));

      this.logger.log(`📄 Final docs to insert:`, docs.length);

      try {
        const result = await this.tuitionFeeModel.insertMany(docs, { ordered: false });
        console.log("Đã insert thành công:", result.length, "documents");
      } catch (err) {
        console.error("Có lỗi xảy ra khi insert:", err);
        if (err.insertedDocs) {
          console.log("Số lượng document đã insert được:", err.insertedDocs.length);
        }
      }
      this.logger.log(`📊 Inserted ${uniqueTuitionFees.length} tuition fees`);
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
  } // cái này là gì

  /**
   * Add data user role admin
   */
  async addUserRoleAdmin(): Promise<void> {
    await this.userModel.create([
      {
        email: 'admin1@fpt.edu.vn',
        password: 'admin123', // Nên hash password nếu production
        fullName: 'Super Admin 1',
        role: 'admin',
        status: 'active',
        isVerified: true
      },
      {
        email: 'admin2@fpt.edu.vn',
        password: 'admin123', // Nên hash password nếu production
        fullName: 'Super Admin 2',
        role: 'admin',
        status: 'active',
        isVerified: true
      }
    ]);
  }
}
