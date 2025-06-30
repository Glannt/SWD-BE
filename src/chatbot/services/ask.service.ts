import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { AskQuestionDto } from '../dto/ask-question.dto';
import { MongoDbDataService } from '../../mongo/mongo.service';
import { PineconeService } from '../../pinecone/pinecone.service';
import { GeminiService } from '../../gemini/gemini.service';
import { ChatsessionService } from '../../chatsession/chatsession.service';

@Injectable()
export class AskService {
  private readonly logger = new Logger(AskService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly pineconeService: PineconeService,
    // @Inject(forwardRef(() => MongoDbDataService))
    private readonly mongoDbDataService: MongoDbDataService,
    private readonly chatsessionService: ChatsessionService,
    // @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  /**
   * Xử lý câu hỏi của người dùng với session management tự động
   * @param askQuestionDto DTO chứa câu hỏi và thông tin session
   * @returns Câu trả lời và thông tin session
   */
  async processQuestionWithSession(askQuestionDto: AskQuestionDto): Promise<{
    answer: string;
    sessionId: string;
    messageId: string;
  }> {
    const { question, sessionId, userId, anonymousId } = askQuestionDto;
    const startTime = Date.now();
    this.logger.log(
      `🤖 [${new Date().toISOString()}] Processing question with session: ${question}`,
    );

    try {
      // Input validation
      if (!question || question.trim().length === 0) {
        throw new Error('Question is empty or invalid');
      }

      const cleanQuestion = question.trim();
      this.logger.log(`📋 Cleaned question: "${cleanQuestion}"`);

      // Xử lý câu hỏi để lấy câu trả lời
      const answer = await this.processQuestion(askQuestionDto);

      // Tự động quản lý session và lưu messages
      const sessionResult = await this.chatsessionService.handleChat(
        cleanQuestion,
        answer,
        sessionId,
        userId,
        anonymousId,
      );

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ [SUCCESS] Question processed with session in ${processingTime}ms`,
      );

      return {
        answer,
        sessionId: sessionResult.sessionId,
        messageId: sessionResult.messageId,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ [ERROR] Question processing failed after ${processingTime}ms:`,
        error.message,
      );

      // Fallback answer
      const fallbackAnswer = this.getFallbackAnswer(question);

      // Vẫn tạo session và lưu fallback message
      try {
        const sessionResult = await this.chatsessionService.handleChat(
          question,
          fallbackAnswer,
          sessionId,
          userId,
          anonymousId,
        );

        return {
          answer: fallbackAnswer,
          sessionId: sessionResult.sessionId,
          messageId: sessionResult.messageId,
        };
      } catch (sessionError) {
        this.logger.error(
          '❌ Session management failed:',
          sessionError.message,
        );
        return {
          answer: fallbackAnswer,
          sessionId: sessionId || 'error',
          messageId: 'error',
        };
      }
    }
  }

  /**
   * Xử lý câu hỏi của người dùng bằng MongoDB-first approach với RAG enhancement
   * @param question Câu hỏi của người dùng
   * @returns Câu trả lời được tạo bởi Gemini dựa trên dữ liệu từ MongoDB và Vector DB
   */
  async processQuestion(askQuestionDto: AskQuestionDto): Promise<string> {
    const { question } = askQuestionDto;
    const startTime = Date.now();
    this.logger.log(
      `🤖 [${new Date().toISOString()}] Processing question: ${question}`,
    );

    try {
      // Input validation
      if (!question || question.trim().length === 0) {
        throw new Error('Question is empty or invalid');
      }

      const cleanQuestion = question.trim();
      this.logger.log(`📋 Cleaned question: "${cleanQuestion}"`);

      // Bước 1: MongoDB Primary Search (Optimized)
      let context = '';
      const mongoSuccess = false;

      try {
        this.logger.log('🗄️ [STEP 1] Searching MongoDB (Primary Source)...');
        // const mongoContext = await this.mongoDbDataService.getRealtimeContext(cleanQuestion);

        // if (mongoContext && mongoContext.length > 0) {
        //   context = mongoContext;
        //   mongoSuccess = true;
        //   this.logger.log(`✅ MongoDB context found: ${mongoContext.length} chars`);
        // } else {
        //   this.logger.log('⚠️ No MongoDB context found');
        // }
      } catch (mongoError) {
        this.logger.error('❌ MongoDB search failed:', mongoError.message);
      }

      // Bước 2: Vector Enhancement (Always try for better context)
      try {
        this.logger.log('🔍 [STEP 2] Vector search for enhanced context...');
        const questionEmbedding =
          await this.geminiService.createEmbedding(cleanQuestion);
        const searchResults = await this.pineconeService.queryVectors(
          questionEmbedding,
          mongoSuccess ? 3 : 5,
        );

        if (searchResults && searchResults.length > 0) {
          const vectorContext = searchResults
            .filter((result) => result.metadata && result.metadata.text)
            .map((result, index) => {
              const metadata = result.metadata || {};
              const text = metadata.text || '';
              const source = metadata.source || 'vector-db';
              const score = result.score
                ? ` (${(result.score * 100).toFixed(1)}%)`
                : '';
              return `[${source}${score}] ${text}`;
            })
            .join('\n');

          if (mongoSuccess) {
            context = `${context}\n\n--- Thông tin bổ sung từ Vector DB ---\n${vectorContext}`;
            this.logger.log(
              `✅ Enhanced MongoDB with ${searchResults.length} vector results`,
            );
          } else {
            context = vectorContext;
            this.logger.log(
              `✅ Using ${searchResults.length} vector results as primary context`,
            );
          }
        } else {
          this.logger.log('⚠️ No vector results found');
        }
      } catch (vectorError) {
        this.logger.warn(`⚠️ Vector search failed: ${vectorError.message}`);
      }

      // Fallback if no context found
      if (!context || context.trim().length === 0) {
        this.logger.log(
          '⚠️ No context found from any source, using general information',
        );
        context =
          'Thông tin tổng quan về Đại học FPT: đào tạo công nghệ thông tin, kinh doanh, với nhiều cơ sở tại Việt Nam.';
      }

      this.logger.log(`📄 Final context: ${context.length} chars`);

      // Bước 3: AI Answer Generation (Optimized)
      this.logger.log('🧠 [STEP 3] Generating AI answer...');
      const answer = await this.geminiService.generateAnswer(
        context,
        cleanQuestion,
      );

      const processingTime = Date.now() - startTime;
      this.logger.log(`✅ [SUCCESS] Question processed in ${processingTime}ms`);

      return answer;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ [ERROR] Question processing failed after ${processingTime}ms:`,
        error.message,
      );

      // Enhanced fallback with error context
      this.logger.log('🔄 Using enhanced static fallback...');
      return this.getFallbackAnswer(question);
    }
  }

  /**
   * Lấy ngữ cảnh realtime từ MongoDB dựa trên từ khóa trong câu hỏi
   * DEPRECATED: Moved to MongoDbDataService.getRealtimeContext()
   * @param question Câu hỏi của người dùng
   * @returns Ngữ cảnh từ MongoDB hoặc null
   */
  private async getRealtimeMongoContext_DEPRECATED(
    question: string,
  ): Promise<string | null> {
    try {
      const lowerQuestion = question.toLowerCase();
      const contextParts: string[] = [];

      this.logger.log(
        `🔍 Analyzing question for MongoDB context: "${lowerQuestion}"`,
      );

      // Tìm kiếm campus
      if (
        lowerQuestion.includes('campus') ||
        lowerQuestion.includes('cơ sở') ||
        lowerQuestion.includes('địa chỉ')
      ) {
        this.logger.log('🏫 Searching for campus information...');
        const stats = await this.mongoDbDataService.getDataStatistics();
        if (stats.campuses > 0) {
          // Tìm campus cụ thể nếu có
          const campusKeywords = [
            'hà nội',
            'hcm',
            'đà nẵng',
            'cần thơ',
            'quy nhon',
          ];
          for (const keyword of campusKeywords) {
            if (lowerQuestion.includes(keyword)) {
              const campus =
                await this.mongoDbDataService.getCampusByName(keyword);
              if (campus) {
                contextParts.push(
                  `Campus ${campus.name}: ${campus.address}. ${campus.contactInfo}. ${campus.descriptionHighlights}`,
                );
                this.logger.log(`✅ Found campus: ${campus.name}`);
                break;
              }
            }
          }
        }
      }

      // Tìm kiếm thông tin ngành học - CẢI THIỆN LOGIC
      if (
        lowerQuestion.includes('ngành') ||
        lowerQuestion.includes('major') ||
        lowerQuestion.includes('chuyên ngành') ||
        lowerQuestion.includes('kỹ thuật') ||
        lowerQuestion.includes('học')
      ) {
        this.logger.log('🎓 Searching for major information...');

        // Debug: Check data availability first
        const stats = await this.mongoDbDataService.getDataStatistics();
        this.logger.log('📊 MongoDB stats for major search:', stats);

        if (stats.majors === 0) {
          this.logger.log('❌ No majors found in MongoDB!');
        }

        // Mở rộng từ khóa tìm kiếm ngành học
        const majorKeywords = [
          // Mã ngành
          'se',
          'ai',
          'is',
          'ia',
          'ds',
          'iot',
          'gd',
          'mc',
          'mkt',
          'bf',
          'ba',
          'hrm',
          'act',
          'em',
          'hm',
          'el',
          // Tên tiếng Việt
          'phần mềm',
          'kỹ thuật phần mềm',
          'software engineering',
          'trí tuệ',
          'trí tuệ nhân tạo',
          'artificial intelligence',
          'hệ thống thông tin',
          'information system',
          'an toàn',
          'an toàn thông tin',
          'information assurance',
          'cybersecurity',
          'dữ liệu',
          'khoa học dữ liệu',
          'data science',
          'iot',
          'internet vạn vật',
          'internet of things',
          'đồ họa',
          'thiết kế đồ họa',
          'graphic design',
          'đa phương tiện',
          'multimedia',
          'marketing',
          'digital marketing',
          'tài chính',
          'ngân hàng',
          'banking finance',
          'quản trị',
          'quản trị kinh doanh',
          'business administration',
          'nhân lực',
          'quản trị nhân lực',
          'human resources',
          'kế toán',
          'accounting',
          'sự kiện',
          'quản lý sự kiện',
          'event management',
          'khách sạn',
          'quản trị khách sạn',
          'hotel management',
          'tiếng anh',
          'ngôn ngữ anh',
          'english',
        ];

        for (const keyword of majorKeywords) {
          if (lowerQuestion.includes(keyword)) {
            this.logger.log(`🔍 Found keyword: "${keyword}"`);
            const major =
              await this.mongoDbDataService.getMajorByCodeOrName(keyword);
            if (major) {
              contextParts.push(
                `Ngành ${major.name} (${major.code}): ${major.description}. Cơ hội nghề nghiệp: ${major.careerOpportunities}. Tổng tín chỉ: ${major.totalCredits}. Thời gian: ${major.programDuration}`,
              );
              this.logger.log(`✅ Found major: ${major.name} (${major.code})`);
              break;
            }
          }
        }

        // Nếu không tìm thấy ngành cụ thể, thử tìm tất cả ngành
        if (contextParts.length === 0) {
          this.logger.log('🔄 No specific major found, getting all majors...');
          const stats = await this.mongoDbDataService.getDataStatistics();
          if (stats.majors > 0) {
            // Lấy một vài ngành phổ biến để giới thiệu
            const seMajor =
              await this.mongoDbDataService.getMajorByCodeOrName('SE');
            const aiMajor =
              await this.mongoDbDataService.getMajorByCodeOrName('AI');

            const majorInfo = [];
            if (seMajor) majorInfo.push(`${seMajor.name} (${seMajor.code})`);
            if (aiMajor) majorInfo.push(`${aiMajor.name} (${aiMajor.code})`);

            if (majorInfo.length > 0) {
              contextParts.push(
                `FPT University có các ngành đào tạo chính: ${majorInfo.join(', ')} và nhiều ngành khác. Tổng cộng ${stats.majors} ngành đào tạo.`,
              );
              this.logger.log(
                `✅ Found general major info: ${stats.majors} majors`,
              );
            }
          }
        }
      }

      // Tìm kiếm học phí
      if (
        lowerQuestion.includes('học phí') ||
        lowerQuestion.includes('chi phí') ||
        lowerQuestion.includes('tuition') ||
        lowerQuestion.includes('giá') ||
        lowerQuestion.includes('tiền')
      ) {
        this.logger.log('💰 Searching for tuition information...');
        const majorKeywords = [
          'se',
          'ai',
          'is',
          'ia',
          'ds',
          'iot',
          'phần mềm',
          'trí tuệ',
          'an toàn',
        ];
        for (const keyword of majorKeywords) {
          if (lowerQuestion.includes(keyword)) {
            const tuitionFees =
              await this.mongoDbDataService.getTuitionFeeByMajorCode(
                keyword.toUpperCase(),
              );
            if (tuitionFees && tuitionFees.length > 0) {
              const fee = tuitionFees[0];
              const majorInfo = fee.major as any;
              contextParts.push(
                `Học phí ngành ${majorInfo?.name}: ${fee.baseAmount.toLocaleString('vi-VN')} ${fee.currency} cho ${fee.semesterRange}. Hiệu lực từ: ${fee.effectiveFrom?.toLocaleDateString('vi-VN')}`,
              );
              this.logger.log(`✅ Found tuition for: ${majorInfo?.name}`);
              break;
            }
          }
        }
      }

      // Tìm kiếm học bổng
      if (
        lowerQuestion.includes('học bổng') ||
        lowerQuestion.includes('scholarship') ||
        lowerQuestion.includes('hỗ trợ') ||
        lowerQuestion.includes('miễn giảm')
      ) {
        this.logger.log('🏆 Searching for scholarship information...');
        const scholarships =
          await this.mongoDbDataService.getActiveScholarships();
        if (scholarships && scholarships.length > 0) {
          const topScholarships = scholarships.slice(0, 3);
          contextParts.push(
            `Học bổng hiện có: ${topScholarships.map((s) => `${s.name} (${s.coverage}${s.value ? ` - ${s.value.toLocaleString('vi-VN')} VND` : ''})`).join(', ')}. Tổng cộng ${scholarships.length} chương trình học bổng.`,
          );
          this.logger.log(`✅ Found ${scholarships.length} scholarships`);
        }
      }

      const result = contextParts.length > 0 ? contextParts.join('\n\n') : null;
      this.logger.log(
        `📄 MongoDB context result: ${result ? 'Found' : 'Not found'}`,
      );

      return result;
    } catch (error) {
      this.logger.error('❌ Lỗi khi lấy dữ liệu MongoDB realtime:', error);
      return null;
    }
  }

  /**
   * Trả lời fallback dựa trên từ khóa khi cả RAG và MongoDB đều không hoạt động
   * @param question Câu hỏi của người dùng
   * @returns Câu trả lời fallback
   */
  private getFallbackAnswer(question: string): string {
    const lowerQuestion = question.toLowerCase();

    this.logger.log(`🔄 Using fallback answer for: "${lowerQuestion}"`);

    // Fallback cho các ngành học cụ thể
    if (
      lowerQuestion.includes('ngành') ||
      lowerQuestion.includes('kỹ thuật') ||
      lowerQuestion.includes('phần mềm') ||
      lowerQuestion.includes('major') ||
      lowerQuestion.includes('software') ||
      lowerQuestion.includes('ai') ||
      lowerQuestion.includes('trí tuệ') ||
      lowerQuestion.includes('an toàn') ||
      lowerQuestion.includes('dữ liệu')
    ) {
      let response = `🎓 **Thông tin các ngành đào tạo tại FPT University (Fallback):**\n\n`;

      if (
        lowerQuestion.includes('phần mềm') ||
        lowerQuestion.includes('software') ||
        lowerQuestion.includes('se')
      ) {
        response += `**🔧 Kỹ thuật phần mềm (SE):**
- Đào tạo kỹ sư phần mềm chuyên nghiệp
- Kỹ năng: Lập trình, thiết kế hệ thống, quản lý dự án
- Cơ hội nghề nghiệp: Developer, Team Leader, Solution Architect
- Thời gian: 4 năm, 144 tín chỉ
- Học phí: ~20.500.000 VND/học kỳ\n\n`;
      }

      if (lowerQuestion.includes('ai') || lowerQuestion.includes('trí tuệ')) {
        response += `**🤖 Trí tuệ nhân tạo (AI):**
- Chương trình tiên tiến về AI, Machine Learning, Deep Learning
- Kỹ năng: Computer Vision, NLP, Data Science
- Cơ hội nghề nghiệp: AI Engineer, Data Scientist, ML Engineer
- Thời gian: 4 năm, 144 tín chỉ
- Học phí: ~21.500.000 VND/học kỳ\n\n`;
      }

      if (
        lowerQuestion.includes('an toàn') ||
        lowerQuestion.includes('security')
      ) {
        response += `**🔒 An toàn thông tin (IA):**
- Chuyên ngành về bảo mật mạng, an toàn hệ thống
- Kỹ năng: Penetration Testing, Forensics, Risk Management
- Cơ hội nghề nghiệp: Security Engineer, CISO, Analyst
- Thời gian: 4 năm, 144 tín chỉ
- Học phí: ~20.500.000 VND/học kỳ\n\n`;
      }

      response += `📞 **Liên hệ để biết thêm chi tiết:**
- Hotline: (024) 7300 1866
- Email: daihocfpt@fpt.edu.vn
- Website: fpt.edu.vn

⚠️ *Thông tin này là dự phòng. Để có thông tin chính xác và cập nhật nhất, vui lòng liên hệ trực tiếp.*`;

      return response;
    }

    if (
      lowerQuestion.includes('học phí') ||
      lowerQuestion.includes('chi phí')
    ) {
      return `📚 **Thông tin học phí FPT University (Fallback):**

**Kỹ thuật phần mềm (SE):** 20.500.000 VND/học kỳ
**Trí tuệ nhân tạo (AI):** 21.500.000 VND/học kỳ
**An toàn thông tin (IS):** 20.500.000 VND/học kỳ
**Quản trị kinh doanh (BA):** 19.500.000 VND/học kỳ

*Học phí được tính theo tín chỉ và có thể thay đổi theo từng năm học.*

📞 Liên hệ: (024) 7300 1866 để biết thêm chi tiết.

⚠️ *Thông tin này là dự phòng. Để có thông tin chính xác nhất, vui lòng liên hệ trực tiếp.*`;
    }

    if (
      lowerQuestion.includes('campus') ||
      lowerQuestion.includes('cơ sở') ||
      lowerQuestion.includes('địa chỉ')
    ) {
      return `🏫 **Các campus của FPT University (Fallback):**

**🌟 Hà Nội (Campus chính)**
📍 Khu Công nghệ cao Hòa Lạc, Km29 Đại lộ Thăng Long, Thạch Thất, Hà Nội
📞 (024) 7300 1866

**🌟 Hồ Chí Minh**
📍 Lô E2a-7, Đường D1, Khu Công nghệ cao, TP. Thủ Đức
📞 (028) 7300 1866

**🌟 Đà Nẵng**
📍 Khu đô thị công nghệ FPT Đà Nẵng, P. Hòa Hải, Q. Ngũ Hành Sơn
📞 (0236) 7300 999

⚠️ *Thông tin này là dự phòng. Để có thông tin chính xác nhất, vui lòng liên hệ trực tiếp.*`;
    }

    if (
      lowerQuestion.includes('xin chào') ||
      lowerQuestion.includes('hello') ||
      lowerQuestion.includes('hi')
    ) {
      return `Xin chào! 👋 Tôi là AI chatbot tư vấn nghề nghiệp của FPT University.

🔄 **Hệ thống đang hoạt động với:**
- 🎯 RAG (Retrieval-Augmented Generation) với Pinecone + Gemini AI
- 🗄️ MongoDB real-time data integration
- 📊 JSON file backup data
- 🔧 Fallback responses

Tôi có thể trả lời câu hỏi về:
🎓 Các ngành đào tạo
💰 Học phí
🏆 Học bổng
🏫 Thông tin campus
📞 Thông tin liên hệ

Hãy đặt câu hỏi để tôi có thể hỗ trợ bạn! 😊`;
    }

    // Câu trả lời mặc định
    return `Xin lỗi, hiện tại tôi đang gặp sự cố kỹ thuật với cả hệ thống vector database và MongoDB.

**🔧 Các hệ thống đang gặp vấn đề:**
- Vector Search (Pinecone + Gemini)
- MongoDB Real-time Data
- Backup JSON Data

Bạn có thể liên hệ trực tiếp:
📞 Hotline: (024) 7300 1866
📧 Email: daihocfpt@fpt.edu.vn
🌐 Website: fpt.edu.vn

Hoặc thử đặt câu hỏi lại sau vài phút.`;
  }
}
