import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Tạo embedding từ text sử dụng Gemini text-embedding-004
   * @param text Văn bản cần tạo embedding
   * @returns Vector embedding 768 chiều
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      console.log('Đang tạo embedding cho văn bản:', text.substring(0, 100) + '...');
      
      const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text);
      
      if (result.embedding && result.embedding.values) {
        const embedding = result.embedding.values;
        console.log('Đã tạo embedding thành công với', embedding.length, 'chiều');
        return embedding;
      }
      
      throw new Error('Không thể tạo embedding từ Gemini API');
    } catch (error) {
      console.error('Lỗi khi tạo embedding:', error);
      throw new Error(`Lỗi Gemini embedding: ${error.message}`);
    }
  }

  /**
   * Tạo câu trả lời từ context sử dụng Gemini generative model
   * @param question Câu hỏi của người dùng
   * @param context Context từ vector search
   * @returns Câu trả lời được tạo
   */
  async generateAnswer(question: string, context: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const prompt = `Bạn là chatbot tư vấn nghề nghiệp của FPT University. Hãy trả lời câu hỏi dựa trên thông tin được cung cấp.

CÂUHỎI: ${question}

THÔNG TIN TỪ CƠ SỞ DỮ LIỆU:
${context}

YÊU CẦU:
- Trả lời bằng tiếng Việt
- Sử dụng emoji phù hợp
- Format đẹp với markdown
- Thông tin chính xác dựa trên context
- Thêm thông tin liên hệ cuối câu trả lời
- Giữ tone thân thiện, chuyên nghiệp

LIÊN HỆ:
📞 Hotline: (024) 7300 1866
📧 Email: daihocfpt@fpt.edu.vn`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (text && text.trim().length > 0) {
        console.log('✅ Generated answer using Gemini');
        return text;
      }
      
      throw new Error('Gemini không trả về câu trả lời hợp lệ');
    } catch (error) {
      console.error('Lỗi khi tạo câu trả lời:', error);
      throw new Error(`Lỗi Gemini generation: ${error.message}`);
    }
  }
} 