import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campus } from '../../entity/campus.entity';
import { Major } from '../../entity/major.entity';
import { TuitionFee } from '../../entity/tution-fees.entity';
import { Scholarship } from '../../entity/scholarships.entity';


@Injectable()
export class MongoDbDataService {
  private readonly logger = new Logger(MongoDbDataService.name);

  constructor(
    @InjectModel(Campus.name) private campusModel: Model<Campus>,
    @InjectModel(Major.name) private majorModel: Model<Major>,
    @InjectModel(TuitionFee.name) private tuitionFeeModel: Model<TuitionFee>,
    @InjectModel(Scholarship.name) private scholarshipModel: Model<Scholarship>,

  ) {}

  /**
   * Lấy tất cả dữ liệu từ MongoDB và chuyển đổi thành chunks để tạo embeddings
   */
  async getAllDataAsChunks(): Promise<{ text: string; metadata: any }[]> {
    try {
      this.logger.log('🔍 Fetching all data from MongoDB...');
      const chunks = [];

      // Lấy dữ liệu campuses
      const campuses = await this.campusModel.find().exec();
      for (const campus of campuses) {
        const text = `
          Tên campus: ${campus.name}
          Địa chỉ: ${campus.address}
          Thông tin liên hệ: ${campus.contactInfo}
          Mô tả nổi bật: ${campus.descriptionHighlights}
        `.trim();

        chunks.push({
          text,
          metadata: {
            type: 'campus',
            name: campus.name,
            id: campus._id.toString(),
          },
        });
      }

      // Lấy dữ liệu majors
      const majors = await this.majorModel.find().exec();
      for (const major of majors) {
        const text = `
          Tên ngành: ${major.name}
          Mã ngành: ${major.code}
          Mô tả: ${major.description}
          Cơ hội nghề nghiệp: ${major.careerOpportunities}
          Yêu cầu tuyển sinh: ${major.generalAdmissionRequirements}
          Tổng số tín chỉ: ${major.totalCredits}
          Thời gian đào tạo: ${major.programDuration}
          Hình thức đào tạo: ${major.deliveryMode}
        `.trim();

        chunks.push({
          text,
          metadata: {
            type: 'major',
            code: major.code,
            name: major.name,
            id: major._id.toString(),
          },
        });
      }

      // Lấy dữ liệu học phí với populate
      const tuitionFees = await this.tuitionFeeModel
        .find()
        .populate('major', 'name code')
        .exec();
      for (const fee of tuitionFees) {
        const majorInfo = fee.major as any;
        const text = `
          Ngành: ${majorInfo?.name || 'N/A'} (${majorInfo?.code || 'N/A'})
          Học kỳ: ${fee.semesterRange}
          Học phí: ${fee.baseAmount} ${fee.currency}
          Ghi chú: ${fee.notes || 'Không có ghi chú'}
          Hiệu lực từ: ${fee.effectiveFrom?.toLocaleDateString('vi-VN') || 'N/A'}
        `.trim();

        chunks.push({
          text,
          metadata: {
            type: 'tuition',
            majorCode: majorInfo?.code,
            semester: fee.semesterRange,
            amount: fee.baseAmount,
            id: fee._id.toString(),
          },
        });
      }

      // Lấy dữ liệu học bổng
      const scholarships = await this.scholarshipModel
        .find({ isActive: true })
        .exec();
      for (const scholarship of scholarships) {
        const text = `
          Tên học bổng: ${scholarship.name}
          Mô tả: ${scholarship.description}
          Giá trị: ${scholarship.value || 'Chưa xác định'}
          Loại: ${scholarship.coverage}
          Yêu cầu: ${scholarship.requirements}
          Quy trình đăng ký: ${scholarship.applicationProcess}
          Thông tin hạn chót: ${scholarship.deadlineInfo}
          Điều kiện duy trì: ${scholarship.maintenanceCondition || 'Không có'}
        `.trim();

        chunks.push({
          text,
          metadata: {
            type: 'scholarship',
            name: scholarship.name,
            coverage: scholarship.coverage,
            id: scholarship._id.toString(),
          },
        });
      }

      this.logger.log(`✅ Generated ${chunks.length} chunks from MongoDB data`);
      return chunks;
    } catch (error) {
      this.logger.error('❌ Error fetching data from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Lấy dữ liệu campus theo tên
   */
  async getCampusByName(name: string): Promise<Campus | null> {
    return this.campusModel.findOne({ name: new RegExp(name, 'i') }).exec();
  }

  /**
   * Lấy dữ liệu ngành theo mã hoặc tên
   */
  async getMajorByCodeOrName(query: string): Promise<Major | null> {
    return this.majorModel
      .findOne({
        $or: [
          { code: new RegExp(query, 'i') },
          { name: new RegExp(query, 'i') },
        ],
      })
      .exec();
  }

  /**
   * Lấy học phí theo mã ngành
   */
  async getTuitionFeeByMajorCode(majorCode: string): Promise<TuitionFee[]> {
    const major = await this.majorModel.findOne({ code: majorCode }).exec();
    if (!major) return [];

    return this.tuitionFeeModel
      .find({ major: major._id })
      .populate('major', 'name code')
      .sort({ semesterRange: 1 })
      .exec();
  }

  /**
   * Lấy tất cả học bổng đang hoạt động
   */
  async getActiveScholarships(): Promise<Scholarship[]> {
    return this.scholarshipModel.find({ isActive: true }).exec();
  }

  /**
   * Thống kê tổng quan dữ liệu
   */
  async getDataStatistics(): Promise<{
    campuses: number;
    majors: number;
    tuitionFees: number;
    scholarships: number;
  }> {
    try {
      console.log('📊 Getting data statistics from MongoDB...');
      
      const [campuses, majors, tuitionFees, scholarships] = await Promise.all([
        this.campusModel.countDocuments(),
        this.majorModel.countDocuments(),
        this.tuitionFeeModel.countDocuments(),
        this.scholarshipModel.countDocuments({ isActive: true }),
      ]);

      const result = { campuses, majors, tuitionFees, scholarships };
      console.log('📈 MongoDB Statistics:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error getting MongoDB statistics:', error.message);
      console.log('🔧 MongoDB connection might be down or collections missing');
      
      // Return zero counts on error
      return { campuses: 0, majors: 0, tuitionFees: 0, scholarships: 0 };
    }
  }

  /**
   * Get realtime context for questions - Enhanced with better error handling
   */
  async getRealtimeContext(question: string): Promise<string | null> {
    try {
      console.log(`🔍 [MongoDB] Searching for context: "${question}"`);
      
      // First check if we have any data at all
      const stats = await this.getDataStatistics();
      const totalData = stats.campuses + stats.majors + stats.tuitionFees + stats.scholarships;
      
      if (totalData === 0) {
        console.log('⚠️ MongoDB has no data available');
        return null;
      }
      
      console.log(`✅ MongoDB has ${totalData} total records available`);
      
      let contextParts: string[] = [];
      const lowerQuestion = question.toLowerCase();
      
      // Campus search
      if (lowerQuestion.includes('campus') || lowerQuestion.includes('cơ sở')) {
        try {
          const campuses = await this.campusModel.find().limit(3).exec();
          if (campuses.length > 0) {
            contextParts.push(`Campus FPT: ${campuses.map(c => c.name + ' tại ' + c.address).join(', ')}`);
          }
        } catch (error) {
          console.log('❌ Campus search error:', error.message);
        }
      }
      
      // Major search with expanded keywords
      if (lowerQuestion.includes('ngành') || lowerQuestion.includes('kỹ thuật') || 
          lowerQuestion.includes('phần mềm') || lowerQuestion.includes('ai') || 
          lowerQuestion.includes('major') || lowerQuestion.includes('software')) {
        try {
          // Try to find specific major
          let major = null;
          if (lowerQuestion.includes('phần mềm') || lowerQuestion.includes('software')) {
            major = await this.majorModel.findOne({ code: 'SE' }).exec();
          } else if (lowerQuestion.includes('ai') || lowerQuestion.includes('trí tuệ')) {
            major = await this.majorModel.findOne({ code: 'AI' }).exec();
          }
          
          if (major) {
            contextParts.push(`Ngành ${major.name} (${major.code}): ${major.description}. Cơ hội nghề nghiệp: ${major.careerOpportunities}.`);
          } else {
            // Get any majors
            const majors = await this.majorModel.find().limit(2).exec();
            if (majors.length > 0) {
              contextParts.push(`Các ngành đào tạo: ${majors.map(m => m.name + ' (' + m.code + ')').join(', ')}`);
            }
          }
        } catch (error) {
          console.log('❌ Major search error:', error.message);
        }
      }
      
      // Tuition search
      if (lowerQuestion.includes('học phí') || lowerQuestion.includes('chi phí')) {
        try {
          const tuitionFees = await this.tuitionFeeModel.find().populate('major').limit(2).exec();
          if (tuitionFees.length > 0) {
            const fee = tuitionFees[0];
            const majorInfo = fee.major as any;
            contextParts.push(`Học phí ${majorInfo?.name || 'các ngành'}: ${fee.baseAmount.toLocaleString()} ${fee.currency} cho ${fee.semesterRange}`);
          }
        } catch (error) {
          console.log('❌ Tuition search error:', error.message);
        }
      }
      
      // Scholarship search
      if (lowerQuestion.includes('học bổng') || lowerQuestion.includes('scholarship')) {
        try {
          const scholarships = await this.scholarshipModel.find({ isActive: true }).limit(2).exec();
          if (scholarships.length > 0) {
            contextParts.push(`Học bổng hiện có: ${scholarships.map(s => s.name + ' (' + s.coverage + ')').join(', ')}`);
          }
        } catch (error) {
          console.log('❌ Scholarship search error:', error.message);
        }
      }
      
      const result = contextParts.length > 0 ? contextParts.join('\n\n') : null;
      console.log(`📄 [MongoDB] Context result: ${result ? `Found (${result.length} chars)` : 'Not found'}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ [MongoDB] getRealtimeContext error:', error.message);
      return null;
    }
  }





  /**
   * Export toàn bộ collections với structure và sample data
   */
  async exportAllCollections() {
    console.log('📤 Exporting all MongoDB collections...');
    
    try {
      const collections: any = {};
      
      // List các collections đã biết trước
      const knownCollections = [
        'campuses', 'majors', 'tuitionFees', 'scholarships',
        'admissionPlans', 'admissionYears', 'intakeBatches', 'majorAdmissionQuotas',
        'englishLevels', 'user', 'chatMessages', 'chatSessions', 'schoolRankSubmissions'
      ];
      
      // Get raw MongoDB connection
      const db = this.campusModel.db;
      
      for (const collectionName of knownCollections) {
        console.log(`📊 Processing collection: ${collectionName}`);
        
        try {
          const collection = db.collection(collectionName);
          const count = await collection.countDocuments();
          
          if (count > 0) {
            // Get sample documents (max 2 per collection)
            const sampleDocs = await collection.find().limit(2).toArray();
            
            // Get field structure from first document
            let fieldStructure = {};
            if (sampleDocs.length > 0) {
              const firstDoc = sampleDocs[0];
              fieldStructure = this.analyzeDocumentStructure(firstDoc);
            }
            
            collections[collectionName] = {
              collectionInfo: {
                name: collectionName,
                totalDocuments: count,
                exists: true
              },
              fieldStructure,
              sampleDocuments: sampleDocs,
              sampleCount: sampleDocs.length
            };
          } else {
            collections[collectionName] = {
              collectionInfo: {
                name: collectionName,
                totalDocuments: 0,
                exists: false
              },
              message: 'Collection exists but empty'
            };
          }
          
        } catch (collError) {
          console.error(`❌ Error processing collection ${collectionName}:`, collError);
          collections[collectionName] = {
            error: collError.message,
            collectionInfo: {
              name: collectionName,
              totalDocuments: 0,
              exists: false
            }
          };
        }
      }
      
      console.log(`✅ Successfully exported ${Object.keys(collections).length} collections`);
      return collections;
      
    } catch (error) {
      console.error('❌ Error exporting collections:', error);
      throw error;
    }
  }

  /**
   * Phân tích cấu trúc document để tạo field schema
   */
  private analyzeDocumentStructure(doc: any, prefix = ''): any {
    const structure: any = {};
    
    for (const [key, value] of Object.entries(doc)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value === null) {
        structure[fullKey] = 'null';
      } else if (Array.isArray(value)) {
        structure[fullKey] = `array[${value.length}]`;
        if (value.length > 0) {
          const firstElement = value[0];
          if (typeof firstElement === 'object' && firstElement !== null) {
            structure[`${fullKey}[0]`] = this.analyzeDocumentStructure(firstElement, '');
          } else {
            structure[`${fullKey}[0]`] = typeof firstElement;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        if (value.constructor.name === 'ObjectId') {
          structure[fullKey] = 'ObjectId';
        } else if (value instanceof Date) {
          structure[fullKey] = 'Date';
        } else {
          structure[fullKey] = 'object';
          // Recursively analyze nested objects (limit depth to avoid infinite recursion)
          if (prefix.split('.').length < 2) {
            Object.assign(structure, this.analyzeDocumentStructure(value, fullKey));
          }
        }
      } else {
        structure[fullKey] = typeof value;
      }
    }
    
    return structure;
  }
} 