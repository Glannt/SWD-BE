import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly geminiModel = 'gemini-1.5-flash';
  private readonly embeddingModel = 'embedding-001';
  private readonly genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(this.configService.getGeminiApiKey());
  }

  /**
   * Tạo embedding cho một đoạn văn bản
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      // Ghi log đoạn văn bản đang được embedding
      this.logger.debug(
        `Creating embedding for text: ${text.substring(0, 50)}...`,
      );

      // Sử dụng Gemini API để tạo embedding
      const embeddingModel = this.genAI.getGenerativeModel({
        model: this.embeddingModel,
      });
      const result = await embeddingModel.embedContent(text);
      const embedding = result.embedding.values;

      // Nếu không thành công, sử dụng phương pháp thay thế
      if (!embedding || embedding.length === 0) {
        this.logger.warn(
          'Failed to get embedding from API, using fallback random vector',
        );
        return this.createRandomEmbedding();
      }

      return embedding;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating embedding: ${errorMessage}`);
      this.logger.warn('Using fallback random embedding due to API error');
      return this.createRandomEmbedding();
    }
  }

  /**
   * Tạo vector embedding ngẫu nhiên (phương pháp dự phòng)
   */
  private createRandomEmbedding(): number[] {
    const embedding = Array(768)
      .fill(0)
      .map(() => Math.random() * 2 - 1);

    // Chuẩn hóa vector để có độ dài 1 (cosine similarity)
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0),
    );
    return embedding.map((val) => val / magnitude);
  }

  /**
   * Sinh câu trả lời dựa trên câu hỏi và ngữ cảnh
   */
  async generateResponse(question: string, context: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.geminiModel,
        // Cấu hình safety settings đã được xóa do không tương thích với phiên bản API
      });

      const prompt = `
      Bạn là một cố vấn hướng nghiệp dành cho học sinh cấp 3, đặc biệt là những học sinh đang chuẩn bị thi vào Đại học FPT.

      🎯 **Mục tiêu của bạn** là giúp học sinh:
      1. Hiểu rõ các ngành học đang được đào tạo tại Đại học FPT.
      2. Chọn ngành học phù hợp với sở thích, năng lực và định hướng tương lai.
      3. Biết các môn học cần tập trung trong quá trình học cấp 3 để chuẩn bị tốt cho ngành học mong muốn.
      4. Có cái nhìn thực tế về triển vọng nghề nghiệp của từng ngành.

      Dưới đây là tài liệu ngữ cảnh được cung cấp (gồm các thông tin chính thức từ Đại học FPT như: ngành đào tạo, điều kiện xét tuyển, định hướng nghề nghiệp, môn học liên quan,...):

      ${context}

      Học sinh đặt câu hỏi như sau:

      "${question}"

      📌 **Yêu cầu khi trả lời:**
      - Chỉ sử dụng thông tin có trong ngữ cảnh.
      - KHÔNG tạo ra hoặc phỏng đoán bất kỳ thông tin nào ngoài ngữ cảnh.
      - Nếu thông tin không có trong ngữ cảnh, hãy trả lời: **"Xin lỗi, tài liệu hiện tại không cung cấp thông tin về vấn đề bạn hỏi."**

      📌 **Định dạng câu trả lời:**
      - Viết bằng ngôn ngữ đơn giản, dễ hiểu đối với học sinh THPT.
      - Trình bày mạch lạc, thân thiện, có thể sử dụng gạch đầu dòng nếu cần.
      - Gợi ý cụ thể về ngành học phù hợp (nếu có) kèm theo môn học cấp 3 nên tập trung.
      - Không quá dài dòng, chỉ tập trung vào việc hỗ trợ chọn ngành và môn học phù hợp.

      Câu trả lời:
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error generating response: ${errorMessage}`);
      throw error;
    }
  }
}
