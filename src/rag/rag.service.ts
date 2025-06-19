import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { DocumentProcessorService } from './document-processor.service';

// Định nghĩa interface cho nguồn trả về cho người dùng
export interface Source {
  text: string;
  metadata: {
    source: string;
    chunk_index: number;
  };
  score: number;
}

// Định nghĩa interface cho kết quả trả về từ API
export interface QueryResult {
  answer: string;
  sources: Source[];
}

// Định nghĩa interface cho kết quả của ingest document
export interface IngestResult {
  success: boolean;
  message: string;
}

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);

  constructor(
    private geminiService: GeminiService,
    private documentProcessorService: DocumentProcessorService,
  ) {}

  /**
   * Ingestion: Xử lý tài liệu - tạm thời chỉ extract text
   */
  async ingestDocument(filePath: string): Promise<IngestResult> {
    try {
      return this.documentProcessorService.processDocument(filePath);
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Error ingesting document: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Query: Tạm thời sử dụng fallback logic không có vector search
   */
  async query(question: string): Promise<QueryResult> {
    try {
      this.logger.log(`Processing query: ${question}`);
      
      // Tạm thời sử dụng fallback logic vì không có vector database
      const answer = await this.getFallbackAnswer(question);
      
      return {
        answer,
        sources: [] // Không có sources vì không có vector search
      };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Error querying RAG: ${errorMessage}`);
      
      return {
        answer: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.',
        sources: []
      };
    }
  }

  /**
   * Fallback logic khi không có vector search
   */
  private async getFallbackAnswer(question: string): Promise<string> {
    const lowerQuestion = question.toLowerCase();
    
    // Sử dụng Gemini để trả lời trực tiếp (không cần context từ vector DB)
    const basePrompt = `Bạn là AI Assistant tư vấn giáo dục của FPT University. 
Hãy trả lời câu hỏi sau một cách hữu ích và chính xác dựa trên kiến thức về FPT University.
Nếu không chắc chắn về thông tin cụ thể, hãy đề xuất liên hệ trực tiếp với nhà trường.

Câu hỏi: ${question}`;

    try {
      return await this.geminiService.generateResponse(question, basePrompt);
    } catch (error) {
      this.logger.error('Failed to get Gemini response, using static fallback');
      
      // Static fallback nếu Gemini cũng fail
      if (lowerQuestion.includes('học phí') || lowerQuestion.includes('chi phí')) {
        return `📚 **Thông tin học phí FPT University:**

**Kỹ thuật phần mềm (SE):** 20.500.000 VND/học kỳ
**Trí tuệ nhân tạo (AI):** 21.500.000 VND/học kỳ  
**An toàn thông tin (IS):** 20.500.000 VND/học kỳ
**Quản trị kinh doanh (BA):** 19.500.000 VND/học kỳ

*Học phí có thể thay đổi theo từng năm học.*

📞 Liên hệ: (024) 7300 1866 để biết thêm chi tiết.`;
      }
      
      return `Xin chào! Tôi là AI chatbot của FPT University. 
      
Để được hỗ trợ tốt nhất, vui lòng liên hệ:
📞 Hotline: (024) 7300 1866
📧 Email: daihocfpt@fpt.edu.vn
🌐 Website: fpt.edu.vn`;
    }
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return (error as { message: string }).message;
    }
    return String(error);
  }
}
