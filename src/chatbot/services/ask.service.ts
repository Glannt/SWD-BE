import { Injectable } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { PineconeService } from './pinecone.service';

@Injectable()
export class AskService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly pineconeService: PineconeService,
  ) {}

  /**
   * Xử lý câu hỏi của người dùng bằng RAG (Retrieval-Augmented Generation)
   * @param question Câu hỏi của người dùng
   * @returns Câu trả lời được tạo bởi Gemini dựa trên dữ liệu từ Pinecone
   */
  async processQuestion(question: string): Promise<string> {
    try {
      console.log(`🤖 Nhận được câu hỏi: ${question}`);
      
      // Bước 1: Tạo embedding cho câu hỏi
      console.log('📝 Đang tạo embedding cho câu hỏi...');
      const questionEmbedding = await this.geminiService.createEmbedding(question);
      
      // Bước 2: Tìm kiếm thông tin liên quan từ Pinecone
      console.log('🔍 Đang tìm kiếm thông tin liên quan trong cơ sở dữ liệu...');
      const searchResults = await this.pineconeService.queryVectors(questionEmbedding, 5);
      
      // Bước 3: Tạo ngữ cảnh từ kết quả tìm kiếm
      let context = '';
      if (searchResults && searchResults.length > 0) {
        console.log(`✅ Tìm thấy ${searchResults.length} thông tin liên quan`);
        context = searchResults
          .map((result, index) => {
            const metadata = result.metadata || {};
            const text = metadata.text || 'Không có nội dung';
            return `${index + 1}. ${text}`;
          })
          .join('\n\n');
      } else {
        console.log('⚠️ Không tìm thấy thông tin liên quan trong cơ sở dữ liệu');
        context = 'Không tìm thấy thông tin cụ thể trong cơ sở dữ liệu.';
      }
      
      console.log(`📄 Ngữ cảnh đã tạo: ${context.substring(0, 200)}...`);
      
      // Bước 4: Sử dụng Gemini để tạo câu trả lời dựa trên ngữ cảnh
      console.log('🧠 Đang tạo câu trả lời bằng Gemini AI...');
      const answer = await this.geminiService.generateAnswer(context, question);
      
      console.log('✅ Hoàn thành xử lý câu hỏi');
      return answer;
      
    } catch (error) {
      console.error('❌ Lỗi khi xử lý câu hỏi:', error);
      
      // Fallback: Trả lời dựa trên từ khóa nếu RAG không hoạt động
      console.log('🔄 Sử dụng fallback logic...');
      return this.getFallbackAnswer(question);
    }
  }

  /**
   * Trả lời fallback dựa trên từ khóa khi RAG không hoạt động
   * @param question Câu hỏi của người dùng
   * @returns Câu trả lời fallback
   */
  private getFallbackAnswer(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('học phí') || lowerQuestion.includes('chi phí')) {
      return `📚 **Thông tin học phí FPT University:**

**Kỹ thuật phần mềm (SE):** 20.500.000 VND/học kỳ
**Trí tuệ nhân tạo (AI):** 21.500.000 VND/học kỳ  
**An toàn thông tin (IS):** 20.500.000 VND/học kỳ
**Quản trị kinh doanh (BA):** 19.500.000 VND/học kỳ

*Học phí được tính theo tín chỉ và có thể thay đổi theo từng năm học.*

📞 Liên hệ: (024) 7300 1866 để biết thêm chi tiết.`;
    }
    
    if (lowerQuestion.includes('campus') || lowerQuestion.includes('cơ sở') || lowerQuestion.includes('địa chỉ')) {
      return `🏫 **Các campus của FPT University:**

**🌟 Hà Nội (Campus chính)**
📍 Khu Công nghệ cao Hòa Lạc, Km29 Đại lộ Thăng Long, Thạch Thất, Hà Nội
📞 (024) 7300 1866

**🌟 Hồ Chí Minh**  
📍 Lô E2a-7, Đường D1, Khu Công nghệ cao, TP. Thủ Đức
📞 (028) 7300 1866

**🌟 Đà Nẵng**
📍 Khu đô thị công nghệ FPT Đà Nẵng, P. Hòa Hải, Q. Ngũ Hành Sơn
📞 (0236) 7300 999

**🌟 Cần Thơ**
📍 Số 600 Nguyễn Văn Cừ nối dài, P. An Bình, Q. Ninh Kiều
📞 (0292) 7300 999`;
    }
    
    if (lowerQuestion.includes('xin chào') || lowerQuestion.includes('hello') || lowerQuestion.includes('hi')) {
      return `Xin chào! 👋 Tôi là AI chatbot tư vấn nghề nghiệp của FPT University. 

Tôi sử dụng công nghệ RAG (Retrieval-Augmented Generation) với Gemini AI để trả lời câu hỏi của bạn dựa trên cơ sở dữ liệu FPT University.

Bạn có thể hỏi tôi về:
🎓 Các ngành đào tạo
💰 Học phí 
🏆 Học bổng
🏫 Thông tin campus
📞 Thông tin liên hệ

Hãy đặt câu hỏi để tôi có thể hỗ trợ bạn! 😊`;
    }
    
    // Câu trả lời mặc định
    return `Xin lỗi, tôi đang gặp sự cố kỹ thuật khi truy cập cơ sở dữ liệu. 

Bạn có thể liên hệ trực tiếp:
📞 Hotline: (024) 7300 1866
📧 Email: daihocfpt@fpt.edu.vn
🌐 Website: fpt.edu.vn

Hoặc thử đặt câu hỏi lại sau vài phút.`;
  }
} 