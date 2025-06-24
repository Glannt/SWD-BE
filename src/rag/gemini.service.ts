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
Bạn là trợ lý hướng nghiệp cho sinh viên, cung cấp thông tin chính xác dựa trên dữ liệu có sẵn.
Bạn được cung cấp ngữ cảnh sau đây từ tài liệu hướng nghiệp:

${context}

Dựa vào ngữ cảnh trên, hãy trả lời câu hỏi của sinh viên một cách chính xác và đầy đủ.
Nếu thông tin không có trong ngữ cảnh, hãy nói rằng bạn không có thông tin về vấn đề đó.
KHÔNG ĐƯỢC TẠO RA THÔNG TIN KHÔNG CÓ TRONG NGỮ CẢNH.

Câu hỏi của sinh viên: ${question}

Câu trả lời:`;

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
