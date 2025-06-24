// import { Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Campus } from '../../entity/campus.entity';
// import { Major } from '../../entity/major.entity';
// import { TuitionFee } from '../../entity/tution-fees.entity';
// import { Scholarship } from '../../entity/scholarships.entity';
// import { CampusDiscount } from '../../entity/campus-discounts.entity';
// import { CampusMajor } from '../../entity/campus-major.entity';
// import { User } from '../../entity/user.entity';
// import { SchoolRankSubmission } from '../../entity/schoolrank-submissions.entity';
// import { MajorAdmissionQuota } from '../../entity/major-admisson-quotas.entity';
// import { IntakeBatch } from '../../entity/intake-batches.entity';
// import { EnglishLevel } from '../../entity/english-levels.entity';
// import { ChatMessage } from '../../entity/chat-message.entity';
// import { ChatSession } from '../../entity/chat-session.entity';
// import { AdmissionYear } from '../../entity/admission-year.entity';
// import { AdmissionPlan } from '../../entity/admission-plans.entity';


// @Injectable()
// export class MongoDbDataService {
//   private readonly logger = new Logger(MongoDbDataService.name);

//   constructor(
//     @InjectModel(Campus.name) private campusModel: Model<Campus>,
//     @InjectModel(Major.name) private majorModel: Model<Major>,
//     @InjectModel(TuitionFee.name) private tuitionFeeModel: Model<TuitionFee>,
//     @InjectModel(Scholarship.name) private scholarshipModel: Model<Scholarship>,
//     @InjectModel(CampusDiscount.name) private campusDiscountModel: Model<CampusDiscount>,
//     @InjectModel(CampusMajor.name) private campusMajorModel: Model<CampusMajor>,
//     @InjectModel(SchoolRankSubmission.name) private schoolRankSubmissionModel: Model<SchoolRankSubmission>,
//     @InjectModel(MajorAdmissionQuota.name) private majorAdmissionQuotaModel: Model<MajorAdmissionQuota>,
//     @InjectModel(IntakeBatch.name) private intakeBatchModel: Model<IntakeBatch>,
//     @InjectModel(EnglishLevel.name) private englishLevelModel: Model<EnglishLevel>,
//     @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessage>,
//     @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSession>,
//     @InjectModel(AdmissionYear.name) private admissionYearModel: Model<AdmissionYear>,
//     @InjectModel(AdmissionPlan.name) private admissionPlanModel: Model<AdmissionPlan>,
//   ) {}

//   /**
//    * Lấy tất cả dữ liệu từ MongoDB và chuyển đổi thành chunks để tạo embeddings
//    */
//   async getAllDataAsChunks(): Promise<{ text: string; metadata: any }[]> {
//     try {
//       this.logger.log('🔍 Fetching all data from MongoDB...');
//       const chunks = [];

//       // Lấy dữ liệu campuses
//       const campuses = await this.campusModel.find().exec();
//       for (const campus of campuses) {
//         const text = `
//           Tên campus: ${campus.name}
//           Địa chỉ: ${campus.address}
//           Thông tin liên hệ: ${campus.contactInfo}
//           Mô tả nổi bật: ${campus.descriptionHighlights}
//         `.trim();

//         chunks.push({
//           text,
//           metadata: {
//             type: 'campus',
//             name: campus.name,
//             id: campus._id.toString(),
//           },
//         });
//       }

//       // Lấy dữ liệu majors
//       const majors = await this.majorModel.find().exec();
//       for (const major of majors) {
//         const text = `
//           Tên ngành: ${major.name}
//           Mã ngành: ${major.code}
//           Mô tả: ${major.description}
//           Cơ hội nghề nghiệp: ${major.careerOpportunities}
//           Yêu cầu tuyển sinh: ${major.generalAdmissionRequirements}
//           Tổng số tín chỉ: ${major.totalCredits}
//           Thời gian đào tạo: ${major.programDuration}
//           Hình thức đào tạo: ${major.deliveryMode}
//         `.trim();

//         chunks.push({
//           text,
//           metadata: {
//             type: 'major',
//             code: major.code,
//             name: major.name,
//             id: major._id.toString(),
//           },
//         });
//       }

//       // Lấy dữ liệu học phí với populate
//       const tuitionFees = await this.tuitionFeeModel
//         .find()
//         .populate('major', 'name code')
//         .exec();
//       for (const fee of tuitionFees) {
//         const majorInfo = fee.major as any;
//         const text = `
//           Ngành: ${majorInfo?.name || 'N/A'} (${majorInfo?.code || 'N/A'})
//           Học kỳ: ${fee.semesterRange}
//           Học phí: ${fee.baseAmount} ${fee.currency}
//           Ghi chú: ${fee.notes || 'Không có ghi chú'}
//           Hiệu lực từ: ${fee.effectiveFrom?.toLocaleDateString('vi-VN') || 'N/A'}
//         `.trim();

//         chunks.push({
//           text,
//           metadata: {
//             type: 'tuition',
//             majorCode: majorInfo?.code,
//             semester: fee.semesterRange,
//             amount: fee.baseAmount,
//             id: fee._id.toString(),
//           },
//         });
//       }

//       // Lấy dữ liệu học bổng
//       const scholarships = await this.scholarshipModel
//         .find({ isActive: true })
//         .exec();
//       for (const scholarship of scholarships) {
//         const text = `
//           Tên học bổng: ${scholarship.name}
//           Mô tả: ${scholarship.description}
//           Giá trị: ${scholarship.value || 'Chưa xác định'}
//           Loại: ${scholarship.coverage}
//           Yêu cầu: ${scholarship.requirements}
//           Quy trình đăng ký: ${scholarship.applicationProcess}
//           Thông tin hạn chót: ${scholarship.deadlineInfo}
//           Điều kiện duy trì: ${scholarship.maintenanceCondition || 'Không có'}
//         `.trim();

//         chunks.push({
//           text,
//           metadata: {
//             type: 'scholarship',
//             name: scholarship.name,
//             coverage: scholarship.coverage,
//             id: scholarship._id.toString(),
//           },
//         });
//       }

//       this.logger.log(`✅ Generated ${chunks.length} chunks from MongoDB data`);
//       return chunks;
//     } catch (error) {
//       this.logger.error('❌ Error fetching data from MongoDB:', error);
//       throw error;
//     }
//   }

//   /**
//    * Lấy tất cả dữ liệu đã JOIN từ MongoDB và chuyển thành các chunks tổng hợp, tối ưu cho ingest vào Vector DB
//    */
//   async getAllDataAsChunks2(): Promise<{ text: string; metadata: any }[]> {
//     this.logger.log('🔍 [getAllDataAsChunks2] Fetching and joining all data for vector ingest (theo CampusMajor)...');
//     const chunks = [];

//     // Lấy tất cả entity cần thiết
//     const [campuses, majors, admissionYears, tuitionFees, campusDiscounts, quotas, scholarships, campusMajors] = await Promise.all([
//       this.campusModel.find().exec(),
//       this.majorModel.find().exec(),
//       this.admissionYearModel.find().exec(),
//       this.tuitionFeeModel.find().populate('major', 'name code').exec(),
//       this.campusDiscountModel.find({ isActive: true }).exec(),
//       this.majorAdmissionQuotaModel.find().exec(),
//       this.scholarshipModel.find({ isActive: true }).exec(),
//       this.campusMajorModel.find().populate('campus').populate('major').exec(),
//     ]);

//     // Map nhanh để tra cứu
//     const campusMap = new Map(campuses.map(c => [c._id.toString(), c]));
//     const majorMap = new Map(majors.map(m => [m._id.toString(), m]));

//     // Duyệt từng CampusMajor
//     for (const campusMajor of campusMajors) {
//       const campus = campusMap.get(campusMajor.campus._id.toString());
//       const major = majorMap.get(campusMajor.major._id.toString());
//       if (!campus || !major) continue;

//       // Lấy học phí theo major
//       const tuitionFee = tuitionFees.find(fee =>
//         (fee.major?._id?.toString() || fee.major?.toString()) === major._id.toString()
//       );

//       // Lấy discount chỉ theo campus (CampusDiscount không có trường major)
//       const discount = campusDiscounts.find(d =>
//         d.campus?.toString() === campus._id.toString()
//       );

//       // Học bổng: chỉ lấy học bổng chung (không lọc theo campus/major vì entity không có)
//       const relatedScholarships = scholarships;

//       // Join với từng admissionYear để lấy quota
//       for (const admissionYear of admissionYears) {
//         const quota = quotas.find(q =>
//           q.campus?.toString() === campus._id.toString() &&
//           q.major?.toString() === major._id.toString() &&
//           q.admissionYear?.toString() === admissionYear._id.toString()
//         );

//         // Nếu có quota hoặc học phí hoặc discount thì mới tạo chunk
//         if (quota || tuitionFee || discount) {
//           let text = `Ngành ${major.name} tại ${campus.name}`;
//           if (admissionYear) text += ` năm tuyển sinh ${admissionYear.year}`;
//           if (quota) text += ` có chỉ tiêu ${quota.quota} sinh viên.`;
//           if (tuitionFee) text += ` Học phí: ${tuitionFee.baseAmount} ${tuitionFee.currency || ''}.`;
//           if (discount) {
//             if (discount.discountType === 'percentage') {
//               text += ` Ưu đãi giảm ${discount.discountValue}% học phí.`;
//             } else if (discount.discountType === 'fixed_amount') {
//               text += ` Ưu đãi giảm ${discount.discountValue} ${tuitionFee?.currency || ''} học phí.`;
//             }
//           }
//           if (relatedScholarships.length > 0) {
//             text += ` Học bổng áp dụng: ` + relatedScholarships.map(s => `${s.name} (${s.value || s.coverage})`).join(', ') + '.';
//           }

//           chunks.push({
//             text,
//             metadata: {
//               campusId: campus._id.toString(),
//               majorId: major._id.toString(),
//               admissionYearId: admissionYear?._id?.toString(),
//               quotaId: quota?._id?.toString(),
//               tuitionFeeId: tuitionFee?._id?.toString(),
//               discountId: discount?._id?.toString(),
//               scholarshipIds: relatedScholarships.map(s => s._id.toString()),
//               type: 'campus-major-admission',
//             }
//           });
//         }
//       }
//     }

//     // Thêm các chunk tổng quan về campus
//     for (const campus of campuses) {
//       const text = `Campus ${campus.name}: ${campus.descriptionHighlights || ''} Địa chỉ: ${campus.address}.`;
//       chunks.push({
//         text,
//         metadata: { campusId: campus._id.toString(), type: 'campus' }
//       });
//     }

//     // Thêm các chunk tổng quan về major
//     for (const major of majors) {
//       const text = `Ngành ${major.name}: ${major.description || ''} Cơ hội nghề nghiệp: ${major.careerOpportunities || ''}.`;
//       chunks.push({
//         text,
//         metadata: { majorId: major._id.toString(), type: 'major' }
//       });
//     }

//     // Thêm các chunk về học bổng độc lập
//     for (const s of scholarships) {
//       const text = `Học bổng: ${s.name}. Giá trị: ${s.value || s.coverage}. Yêu cầu: ${s.requirements || ''}.`;
//       chunks.push({
//         text,
//         metadata: { scholarshipId: s._id.toString(), type: 'scholarship' }
//       });
//     }

//     this.logger.log(`✅ [getAllDataAsChunks2] Generated ${chunks.length} joined chunks for vector ingest.`);
//     return chunks;
//   }

//   /**
//    * Lấy dữ liệu campus theo tên
//    */
//   async getCampusByName(name: string): Promise<Campus | null> {
//     return this.campusModel.findOne({ name: new RegExp(name, 'i') }).exec();
//   }

//   /**
//    * Lấy dữ liệu ngành theo mã hoặc tên
//    */
//   async getMajorByCodeOrName(query: string): Promise<Major | null> {
//     return this.majorModel
//       .findOne({
//         $or: [
//           { code: new RegExp(query, 'i') },
//           { name: new RegExp(query, 'i') },
//         ],
//       })
//       .exec();
//   }

//   /**
//    * Lấy học phí theo mã ngành
//    */
//   async getTuitionFeeByMajorCode(majorCode: string): Promise<TuitionFee[]> {
//     const major = await this.majorModel.findOne({ code: majorCode }).exec();
//     if (!major) return [];

//     return this.tuitionFeeModel
//       .find({ major: major._id })
//       .populate('major', 'name code')
//       .sort({ semesterRange: 1 })
//       .exec();
//   }

//   /**
//    * Lấy tất cả học bổng đang hoạt động
//    */
//   async getActiveScholarships(): Promise<Scholarship[]> {
//     return this.scholarshipModel.find({ isActive: true }).exec();
//   }

//   /**
//    * Lấy học phí các ngành theo từng campus (bao gồm cả discount)
//    */
//   async getTuitionFeesByCampus(): Promise<{
//     campus: string;
//     campusAddress: string;
//     majors: {
//       majorCode: string;
//       majorName: string;
//       tuitionFees: {
//         semester: string;
//         baseAmount: number;
//         currency: string;
//         discountAmount?: number;
//         discountPercentage?: number;
//         finalAmount: number;
//         effectiveFrom?: Date;
//         notes?: string;
//       }[];
//     }[];
//   }[]> {
//     try {
//       this.logger.log('🔍 Fetching tuition fees by campus with discounts...');

//       // Lấy tất cả campus
//       const campuses = await this.campusModel.find().exec();
//       const result = [];

//       for (const campus of campuses) {
//         // Lấy campus-major relationships cho campus này
//         const campusMajors = await this.campusMajorModel
//           .find({ campus: campus._id })
//           .populate('major', 'name code')
//           .exec();

//         const campusData = {
//           campus: campus.name,
//           campusAddress: campus.address,
//           majors: []
//         };

//         for (const campusMajor of campusMajors) {
//           const major = campusMajor.major as any;
//           if (!major) continue;

//           // Lấy học phí cho ngành này
//           const tuitionFees = await this.tuitionFeeModel
//             .find({ major: major._id })
//             .populate('major', 'name code')
//             .sort({ semesterRange: 1 })
//             .exec();

//           // Lấy discount cho campus-major này
//           const campusDiscount = await this.campusDiscountModel
//             .findOne({
//               campus: campus._id,
//               isActive: true
//             })
//             .exec();

//           const majorData = {
//             majorCode: major.code,
//             majorName: major.name,
//             tuitionFees: tuitionFees.map(fee => {
//               let finalAmount = fee.baseAmount;
//               let discountAmount = 0;
//               let discountPercentage = 0;

//               // Tính discount nếu có
//               if (campusDiscount) {
//                 if (campusDiscount.discountType === 'percentage') {
//                   discountPercentage = campusDiscount.discountValue;
//                   discountAmount = (fee.baseAmount * campusDiscount.discountValue) / 100;
//                   finalAmount = fee.baseAmount - discountAmount;
//                 } else if (campusDiscount.discountType === 'fixed_amount') {
//                   discountAmount = campusDiscount.discountValue;
//                   finalAmount = Math.max(0, fee.baseAmount - discountAmount);
//                   discountPercentage = (discountAmount / fee.baseAmount) * 100;
//                 }
//               }

//               return {
//                 semester: fee.semesterRange,
//                 baseAmount: fee.baseAmount,
//                 currency: fee.currency,
//                 discountAmount: discountAmount > 0 ? discountAmount : undefined,
//                 discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
//                 finalAmount: Math.round(finalAmount * 100) / 100, // Round to 2 decimal places
//                 effectiveFrom: fee.effectiveFrom,
//                 notes: fee.notes
//               };
//             })
//           };

//           campusData.majors.push(majorData);
//         }

//         result.push(campusData);
//       }

//       this.logger.log(`✅ Generated tuition fees for ${result.length} campuses`);
//       return result;
//     } catch (error) {
//       this.logger.error('❌ Error fetching tuition fees by campus:', error);
//       throw error;
//     }
//   }

//   /**
//    * Lấy học phí chi tiết cho một campus và ngành cụ thể
//    */
//   async getTuitionFeeForCampusMajor(campusName: string, majorCode: string): Promise<{
//     campus: string;
//     campusAddress: string;
//     major: {
//       code: string;
//       name: string;
//       description: string;
//     };
//     tuitionFees: {
//       semester: string;
//       baseAmount: number;
//       currency: string;
//       discountAmount?: number;
//       discountPercentage?: number;
//       finalAmount: number;
//       effectiveFrom?: Date;
//       notes?: string;
//     }[];
//     discountInfo?: {
//       type: string;
//       value: number;
//       description: string;
//       validFrom?: Date;
//       validTo?: Date;
//     };
//   } | null> {
//     try {
//       // Tìm campus
//       const campus = await this.campusModel.findOne({
//         name: new RegExp(campusName, 'i')
//       }).exec();

//       if (!campus) {
//         this.logger.warn(`❌ Campus not found: ${campusName}`);
//         return null;
//       }

//       // Tìm major
//       const major = await this.majorModel.findOne({
//         code: new RegExp(majorCode, 'i')
//       }).exec();

//       if (!major) {
//         this.logger.warn(`❌ Major not found: ${majorCode}`);
//         return null;
//       }

//       // Lấy học phí
//       const tuitionFees = await this.tuitionFeeModel
//         .find({ major: major._id })
//         .populate('major', 'name code description')
//         .sort({ semesterRange: 1 })
//         .exec();

//       // Lấy discount
//       const campusDiscount = await this.campusDiscountModel
//         .findOne({
//           campus: campus._id,
//           isActive: true
//         })
//         .exec();

//       const result = {
//         campus: campus.name,
//         campusAddress: campus.address,
//         major: {
//           code: major.code,
//           name: major.name,
//           description: major.description
//         },
//         tuitionFees: tuitionFees.map(fee => {
//           let finalAmount = fee.baseAmount;
//           let discountAmount = 0;
//           let discountPercentage = 0;

//           if (campusDiscount) {
//             if (campusDiscount.discountType === 'percentage') {
//               discountPercentage = campusDiscount.discountValue;
//               discountAmount = (fee.baseAmount * campusDiscount.discountValue) / 100;
//               finalAmount = fee.baseAmount - discountAmount;
//             } else if (campusDiscount.discountType === 'fixed_amount') {
//               discountAmount = campusDiscount.discountValue;
//               finalAmount = Math.max(0, fee.baseAmount - discountAmount);
//               discountPercentage = (discountAmount / fee.baseAmount) * 100;
//             }
//           }

//           return {
//             semester: fee.semesterRange,
//             baseAmount: fee.baseAmount,
//             currency: fee.currency,
//             discountAmount: discountAmount > 0 ? discountAmount : undefined,
//             discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
//             finalAmount: Math.round(finalAmount * 100) / 100,
//             effectiveFrom: fee.effectiveFrom,
//             notes: fee.notes
//           };
//         }),
//         discountInfo: campusDiscount ? {
//           type: campusDiscount.discountType,
//           value: campusDiscount.discountValue,
//           description: campusDiscount.description || '',
//           validFrom: campusDiscount.validFrom,
//           validTo: campusDiscount.validTo
//         } : undefined
//       };

//       this.logger.log(`✅ Generated tuition fee details for ${campus.name} - ${major.name}`);
//       return result;
//     } catch (error) {
//       this.logger.error('❌ Error fetching tuition fee for campus-major:', error);
//       throw error;
//     }
//   }

//   /**
//    * Thống kê tổng quan dữ liệu
//    */
//   async getDataStatistics(): Promise<{
//     campuses: number;
//     majors: number;
//     tuitionFees: number;
//     scholarships: number;
//     campusDiscounts: number;
//     campusMajors: number;
//     schoolRankSubmissions: number;
//     majorAdmissionQuotas: number;
//     intakeBatches: number;
//     englishLevels: number;
//     chatMessages: number;
//     chatSessions: number;
//     admissionYears: number;
//     admissionPlans: number;
//   }> {
//     try {
//       console.log('📊 Getting data statistics from MongoDB...');

//       const [
//         campuses,
//         majors,
//         tuitionFees,
//         scholarships,
//         campusDiscounts,
//         campusMajors,
//         schoolRankSubmissions,
//         majorAdmissionQuotas,
//         intakeBatches,
//         englishLevels,
//         chatMessages,
//         chatSessions,
//         admissionYears,
//         admissionPlans
//       ] = await Promise.all([
//         this.campusModel.countDocuments(),
//         this.majorModel.countDocuments(),
//         this.tuitionFeeModel.countDocuments(),
//         this.scholarshipModel.countDocuments({ isActive: true }),
//         this.campusDiscountModel.countDocuments(),
//         this.campusMajorModel.countDocuments(),
//         this.schoolRankSubmissionModel.countDocuments(),
//         this.majorAdmissionQuotaModel.countDocuments(),
//         this.intakeBatchModel.countDocuments(),
//         this.englishLevelModel.countDocuments(),
//         this.chatMessageModel.countDocuments(),
//         this.chatSessionModel.countDocuments(),
//         this.admissionYearModel.countDocuments(),
//         this.admissionPlanModel.countDocuments(),
//       ]);

//       const result = {
//         campuses,
//         majors,
//         tuitionFees,
//         scholarships,
//         campusDiscounts,
//         campusMajors,
//         schoolRankSubmissions,
//         majorAdmissionQuotas,
//         intakeBatches,
//         englishLevels,
//         chatMessages,
//         chatSessions,
//         admissionYears,
//         admissionPlans
//       };
//       console.log('📈 MongoDB Statistics:', result);

//       return result;
//     } catch (error) {
//       console.error('❌ Error getting MongoDB statistics:', error.message);
//       console.log('🔧 MongoDB connection might be down or collections missing');

//       // Return zero counts on error
//       return {
//         campuses: 0,
//         majors: 0,
//         tuitionFees: 0,
//         scholarships: 0,
//         campusDiscounts: 0,
//         campusMajors: 0,
//         schoolRankSubmissions: 0,
//         majorAdmissionQuotas: 0,
//         intakeBatches: 0,
//         englishLevels: 0,
//         chatMessages: 0,
//         chatSessions: 0,
//         admissionYears: 0,
//         admissionPlans: 0
//       };
//     }
//   }

//   /**
//    * Get realtime context for questions - Enhanced with better error handling
//    */
//   async getRealtimeContext(question: string): Promise<string | null> {
//     try {
//       console.log(`🔍 [MongoDB] Searching for context: "${question}"`);

//       // First check if we have any data at all
//       const stats = await this.getDataStatistics();
//       const totalData = stats.campuses + stats.majors + stats.tuitionFees + stats.scholarships +
//                        stats.campusDiscounts + stats.campusMajors + stats.schoolRankSubmissions +
//                        stats.majorAdmissionQuotas + stats.intakeBatches + stats.englishLevels +
//                        stats.chatMessages + stats.chatSessions + stats.admissionYears + stats.admissionPlans;

//       if (totalData === 0) {
//         console.log('⚠️ MongoDB has no data available');
//         return null;
//       }

//       console.log(`✅ MongoDB has ${totalData} total records available`);

//       const contextParts: string[] = [];
//       const lowerQuestion = question.toLowerCase();

//       // Campus search
//       if (lowerQuestion.includes('campus') || lowerQuestion.includes('cơ sở')) {
//         try {
//           const campuses = await this.campusModel.find().limit(3).exec();
//           if (campuses.length > 0) {
//             contextParts.push(`Campus FPT: ${campuses.map(c => c.name + ' tại ' + c.address).join(', ')}`);
//           }
//         } catch (error) {
//           console.log('❌ Campus search error:', error.message);
//         }
//       }

//       // Major search with expanded keywords
//       if (lowerQuestion.includes('ngành') || lowerQuestion.includes('kỹ thuật') ||
//           lowerQuestion.includes('phần mềm') || lowerQuestion.includes('ai') ||
//           lowerQuestion.includes('major') || lowerQuestion.includes('software')) {
//         try {
//           // Try to find specific major
//           let major = null;
//           if (lowerQuestion.includes('phần mềm') || lowerQuestion.includes('software')) {
//             major = await this.majorModel.findOne({ code: 'SE' }).exec();
//           } else if (lowerQuestion.includes('ai') || lowerQuestion.includes('trí tuệ')) {
//             major = await this.majorModel.findOne({ code: 'AI' }).exec();
//           }

//           if (major) {
//             contextParts.push(`Ngành ${major.name} (${major.code}): ${major.description}. Cơ hội nghề nghiệp: ${major.careerOpportunities}.`);
//           } else {
//             // Get any majors
//             const majors = await this.majorModel.find().limit(2).exec();
//             if (majors.length > 0) {
//               contextParts.push(`Các ngành đào tạo: ${majors.map(m => m.name + ' (' + m.code + ')').join(', ')}`);
//             }
//           }
//         } catch (error) {
//           console.log('❌ Major search error:', error.message);
//         }
//       }

//       // Tuition search
//       if (lowerQuestion.includes('học phí') || lowerQuestion.includes('chi phí')) {
//         try {
//           // Use new tuition fee by campus logic
//           const tuitionData = await this.getTuitionFeesByCampus();
//           if (tuitionData && tuitionData.length > 0) {
//             let tuitionContext = '💰 Học phí các ngành theo từng campus:\n';
//             for (const campus of tuitionData) {
//               tuitionContext += `\n🏫 ${campus.campus} (${campus.campusAddress})\n`;
//               for (const major of campus.majors) {
//                 tuitionContext += `- ${major.majorName} (${major.majorCode}):`;
//                 for (const fee of major.tuitionFees) {
//                   tuitionContext += `\n  • ${fee.semester}: ${fee.baseAmount.toLocaleString('vi-VN')} ${fee.currency}`;
//                   if (fee.discountAmount || fee.discountPercentage) {
//                     tuitionContext += ` (Giảm: `;
//                     if (fee.discountPercentage) tuitionContext += `${fee.discountPercentage}%`;
//                     if (fee.discountAmount) tuitionContext += `${fee.discountAmount.toLocaleString('vi-VN')} ${fee.currency}`;
//                     tuitionContext += `)`;
//                   }
//                   tuitionContext += ` → ${fee.finalAmount.toLocaleString('vi-VN')} ${fee.currency}`;
//                   if (fee.effectiveFrom) tuitionContext += ` (Hiệu lực từ: ${new Date(fee.effectiveFrom).toLocaleDateString('vi-VN')})`;
//                   if (fee.notes) tuitionContext += ` [${fee.notes}]`;
//                 }
//                 tuitionContext += '\n';
//               }
//             }
//             contextParts.push(tuitionContext);
//           } else {
//             contextParts.push('Không tìm thấy thông tin học phí cho các campuses.');
//           }
//         } catch (error) {
//           console.log('❌ Tuition search error:', error.message);
//         }
//       }

//       // Scholarship search
//       if (lowerQuestion.includes('học bổng') || lowerQuestion.includes('scholarship')) {
//         try {
//           const scholarships = await this.scholarshipModel.find({ isActive: true }).limit(2).exec();
//           if (scholarships.length > 0) {
//             contextParts.push(`Học bổng hiện có: ${scholarships.map(s => s.name + ' (' + s.coverage + ')').join(', ')}`);
//           }
//         } catch (error) {
//           console.log('❌ Scholarship search error:', error.message);
//         }
//       }

//       const result = contextParts.length > 0 ? contextParts.join('\n\n') : null;
//       console.log(`📄 [MongoDB] Context result: ${result ? `Found (${result.length} chars)` : 'Not found'}`);

//       return result;

//     } catch (error) {
//       console.error('❌ [MongoDB] getRealtimeContext error:', error.message);
//       return null;
//     }
//   }

//   /**
//    * Export toàn bộ collections với structure và sample data
//    */
//   async exportAllCollections() {
//     console.log('📤 Exporting all MongoDB collections...');

//     try {
//       const collections: any = {};

//       // List các collections đã biết trước
//       const knownCollections = [
//         'campuses', 'majors', 'tuitionFees', 'scholarships',
//         'admissionPlans', 'admissionYears', 'intakeBatches', 'majorAdmissionQuotas',
//         'englishLevels', 'user', 'chatMessages', 'chatSessions', 'schoolRankSubmissions'
//       ];

//       // Get raw MongoDB connection
//       const db = this.campusModel.db;

//       for (const collectionName of knownCollections) {
//         console.log(`📊 Processing collection: ${collectionName}`);

//         try {
//           const collection = db.collection(collectionName);
//           const count = await collection.countDocuments();

//           if (count > 0) {
//             // Get sample documents (max 2 per collection)
//             const sampleDocs = await collection.find().limit(2).toArray();

//             // Get field structure from first document
//             let fieldStructure = {};
//             if (sampleDocs.length > 0) {
//               const firstDoc = sampleDocs[0];
//               fieldStructure = this.analyzeDocumentStructure(firstDoc);
//             }

//             collections[collectionName] = {
//               collectionInfo: {
//                 name: collectionName,
//                 totalDocuments: count,
//                 exists: true
//               },
//               fieldStructure,
//               sampleDocuments: sampleDocs,
//               sampleCount: sampleDocs.length
//             };
//           } else {
//             collections[collectionName] = {
//               collectionInfo: {
//                 name: collectionName,
//                 totalDocuments: 0,
//                 exists: false
//               },
//               message: 'Collection exists but empty'
//             };
//           }

//         } catch (collError) {
//           console.error(`❌ Error processing collection ${collectionName}:`, collError);
//           collections[collectionName] = {
//             error: collError.message,
//             collectionInfo: {
//               name: collectionName,
//               totalDocuments: 0,
//               exists: false
//             }
//           };
//         }
//       }

//       console.log(`✅ Successfully exported ${Object.keys(collections).length} collections`);
//       return collections;

//     } catch (error) {
//       console.error('❌ Error exporting collections:', error);
//       throw error;
//     }
//   }

//   /**
//    * Phân tích cấu trúc document để tạo field schema
//    */
//   private analyzeDocumentStructure(doc: any, prefix = ''): any {
//     const structure: any = {};

//     for (const [key, value] of Object.entries(doc)) {
//       const fullKey = prefix ? `${prefix}.${key}` : key;

//       if (value === null) {
//         structure[fullKey] = 'null';
//       } else if (Array.isArray(value)) {
//         structure[fullKey] = `array[${value.length}]`;
//         if (value.length > 0) {
//           const firstElement = value[0];
//           if (typeof firstElement === 'object' && firstElement !== null) {
//             structure[`${fullKey}[0]`] = this.analyzeDocumentStructure(firstElement, '');
//           } else {
//             structure[`${fullKey}[0]`] = typeof firstElement;
//           }
//         }
//       } else if (typeof value === 'object' && value !== null) {
//         if (value.constructor.name === 'ObjectId') {
//           structure[fullKey] = 'ObjectId';
//         } else if (value instanceof Date) {
//           structure[fullKey] = 'Date';
//         } else {
//           structure[fullKey] = 'object';
//           // Recursively analyze nested objects (limit depth to avoid infinite recursion)
//           if (prefix.split('.').length < 2) {
//             Object.assign(structure, this.analyzeDocumentStructure(value, fullKey));
//           }
//         }
//       } else {
//         structure[fullKey] = typeof value;
//       }
//     }

//     return structure;
//   }
// }
