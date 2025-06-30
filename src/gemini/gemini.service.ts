import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '../config/config.service';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private embeddingModel: GenerativeModel;
  private chatModel: GenerativeModel;

  constructor(private configService: ConfigService) {
    // Lấy API key từ ConfigService
    const apiKey = this.configService.getGeminiApiKey();

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required but not configured');
    }

    console.log('✅ Gemini AI initialized with ConfigService');

    // Khởi tạo Google Generative AI
    this.genAI = new GoogleGenerativeAI(apiKey);

    // Khởi tạo model cho embeddings - sử dụng model ổn định
    this.embeddingModel = this.genAI.getGenerativeModel({
      model: 'text-embedding-004',
    });

    // Khởi tạo model cho chat
    this.chatModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  /**
   * Tạo embedding cho văn bản
   * @param text Văn bản cần tạo embedding
   * @returns Vector embedding
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      console.log(`📝 Đang tạo embedding cho văn bản: ${text.substring(0, 50)}...`);

      // Gọi API để tạo embedding với cú pháp đúng
      const result = await this.embeddingModel.embedContent(text);

      const embedding = result.embedding.values;

      console.log(`✅ Đã tạo embedding thành công với ${embedding.length} chiều`);
      return embedding;
    } catch (error) {
      console.error('❌ Lỗi khi tạo embedding:', error);

      // Trả về vector giả lập với kích thước 768 (phù hợp với text-embedding-004)
      console.log('🔄 Trả về vector giả lập với kích thước 768');
      return Array(768).fill(0).map(() => Math.random() - 0.5);
    }
  }

  /**
   * Tạo câu trả lời từ mô hình ngôn ngữ dựa trên ngữ cảnh và câu hỏi
   * @param context Ngữ cảnh (thông tin liên quan)
   * @param question Câu hỏi của người dùng
   * @returns Câu trả lời từ mô hình
   */
  async generateAnswer(context: string, question: string): Promise<string> {
    try {
      console.log(`🤖 Đang tạo câu trả lời cho câu hỏi: ${question}`);
      console.log(`📚 Với ngữ cảnh: ${context.substring(0, 100)}...`);

      // Tạo prompt cho mô hình
      const prompt = `
      🎓 Bạn là **FPT AI Assistant** – trợ lý tư vấn hướng nghiệp thông minh của **Đại học FPT**.

      📌 **Vai trò của bạn:**
      Bạn có nhiệm vụ hỗ trợ học sinh cấp 3 trong việc:
      - Hiểu rõ về các ngành đào tạo tại FPT University.
      - Chọn ngành học phù hợp với sở thích và năng lực cá nhân.
      - Biết những môn học THPT cần tập trung để vào ngành mong muốn.
      - Cung cấp thông tin chính xác, rõ ràng và không gây hiểu nhầm.

      📚 **Dữ liệu cung cấp từ FPT University**:
      ${context}

      💬 **Câu hỏi của học sinh**:
      "${question}"

      ✅ **Hướng dẫn trả lời:**
      - TRẢ LỜI BẰNG TIẾNG VIỆT, văn phong THÂN THIỆN, RÕ RÀNG, KHÍCH LỆ học sinh.
      - CHỈ sử dụng thông tin có trong phần "Dữ liệu cung cấp từ FPT University".
      - KHÔNG suy đoán, KHÔNG tự tạo nội dung không có trong context.
      - SUY NGHĨ và trả lời NHỮNG CÂU HỎI với THÔNG TIN VỪA ĐỦ không cần quá CỨNG NHẮC
      - Nếu thông tin không đủ hoặc không có, hãy trả lời trung thực:
        "**Xin lỗi, hiện tại tôi chưa có thông tin cụ thể về vấn đề bạn hỏi. Bạn có thể liên hệ trực tiếp với Đại học FPT để được tư vấn chi tiết hơn.**"

      🎯 **Yêu cầu định dạng câu trả lời:**
      - Bắt đầu bằng một đoạn chào thân thiện (ví dụ: "Chào bạn, cảm ơn vì câu hỏi rất hay!")
      - Dùng gạch đầu dòng hoặc emoji để dễ đọc.
      - Nếu phù hợp, gợi ý cụ thể các môn học THPT nên học tốt (Toán, Lý, Hóa, Văn,...)
      - Đưa ra định hướng nghề nghiệp nếu thông tin có sẵn.
      - Giữ giọng điệu truyền cảm hứng, phù hợp với học sinh THPT đang định hướng tương lai.

      ✏️ **Trả lời ngay dưới đây:**
      `;

      // Gọi API để tạo câu trả lời
      const result = await this.chatModel.generateContent(prompt);
      const response = result.response;
      const answer = response.text();

      console.log(`✅ Đã tạo câu trả lời thành công: ${answer.substring(0, 100)}...`);
      return answer;
    } catch (error) {
      console.error('❌ Lỗi khi tạo câu trả lời:', error);
      return 'Xin lỗi, hiện tại tôi không thể trả lời câu hỏi của bạn do gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ (024) 7300 1866 để được hỗ trợ trực tiếp.';
    }
  }
}