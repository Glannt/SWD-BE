import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Đảm bảo biến môi trường được đọc
dotenv.config();

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private embeddingModel: GenerativeModel;
  private chatModel: GenerativeModel;

  constructor() {
    // Lấy API key từ biến môi trường hoặc fallback
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDR83qkbHUQtYX9QvvwzA7b69nJP_9_ZlU';
    
    console.log('Gemini API Key:', apiKey ? 'Đã cấu hình (độ dài: ' + apiKey.length + ')' : 'Chưa cấu hình');
    
    // Khởi tạo Google Generative AI
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Khởi tạo model cho embeddings - sử dụng model ổn định
    this.embeddingModel = this.genAI.getGenerativeModel({
      model: 'text-embedding-004',
    });
    
    // Khởi tạo model cho chat
    this.chatModel = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
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
      console.log(`Đang tạo embedding cho văn bản: ${text.substring(0, 50)}...`);
      
      // Gọi API để tạo embedding với cú pháp đúng
      const result = await this.embeddingModel.embedContent(text);
      
      const embedding = result.embedding.values;
      
      console.log(`Đã tạo embedding thành công với ${embedding.length} chiều`);
      return embedding;
    } catch (error) {
      console.error('Lỗi khi tạo embedding:', error);
      
      // Trả về vector giả lập với kích thước 768 (phù hợp với text-embedding-004)
      console.log('Trả về vector giả lập với kích thước 768');
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
      console.log(`Đang tạo câu trả lời cho câu hỏi: ${question}`);
      console.log(`Với ngữ cảnh: ${context.substring(0, 100)}...`);
      
      // Tạo prompt cho mô hình
      const prompt = `
        Bạn là FPT AI Assistant - trợ lý tư vấn thông minh của Đại học FPT University.
        
        HƯỚNG DẪN TRẢI LỜI:
        • Sử dụng CHÍNH XÁC thông tin từ cơ sở dữ liệu được cung cấp
        • Trả lời bằng tiếng Việt, chuyên nghiệp và thân thiện
        • Cấu trúc câu trả lời rõ ràng với emoji phù hợp
        • Nếu không có thông tin cụ thể, hãy thành thật nói và gợi ý liên hệ
        • Ưu tiên thông tin chính thức từ FPT University
        
        THÔNG TIN TỪ CƠ SỞ DỮ LIỆU FPT:
        ${context}
        
        CÂU HỎI CỦA NGƯỜI DÙNG: ${question}
        
        Hãy trả lời dựa trên thông tin trên một cách chi tiết và hữu ích nhất có thể.
      `;
      
      // Gọi API để tạo câu trả lời
      const result = await this.chatModel.generateContent(prompt);
      const response = result.response;
      const answer = response.text();
      
      console.log(`Đã tạo câu trả lời thành công: ${answer.substring(0, 100)}...`);
      return answer;
    } catch (error) {
      console.error('Lỗi khi tạo câu trả lời:', error);
      return 'Xin lỗi, hiện tại tôi không thể trả lời câu hỏi của bạn do gặp sự cố kỹ thuật. Vui lòng thử lại sau.';
    }
  }
} 