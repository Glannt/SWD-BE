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
   * Xử lý câu hỏi từ người dùng sử dụng RAG
   * @param question Câu hỏi của người dùng
   * @returns Câu trả lời
   */
  async processQuestion(question: string): Promise<string> {
    try {
      console.log('🔍 Processing question:', question);

      // 1. Tạo embedding cho câu hỏi
      const questionEmbedding = await this.geminiService.createEmbedding(question);

      // 2. Tìm kiếm trong Pinecone
      const searchResults = await this.pineconeService.queryVectors(questionEmbedding, 3);

      // 3. Trích xuất context từ kết quả
      let context = '';
      if (searchResults && searchResults.length > 0) {
        context = searchResults
          .map(match => {
            if (match.metadata && match.metadata.text) {
              const type = String(match.metadata.type || 'info');
              const score = match.score ? `(${(match.score * 100).toFixed(1)}%)` : '';
              return `[${type.toUpperCase()}] ${score} ${match.metadata.text}`;
            }
            return '';
          })
          .filter(text => text.length > 0)
          .join('\n\n');
      }

      console.log('📊 Found', searchResults?.length || 0, 'relevant matches');

      // 4. Tạo câu trả lời từ context
      if (context.length > 0) {
        return await this.geminiService.generateAnswer(question, context);
      }

      // 5. Fallback response nếu không tìm thấy thông tin phù hợp
      return this.generateFallbackResponse(question);
      
    } catch (error) {
      console.error('❌ Error processing question:', error);
      return 'Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.';
    }
  }

  /**
   * Tạo câu trả lời mặc định khi không tìm thấy thông tin
   * @param question Câu hỏi gốc
   * @returns Câu trả lời fallback
   */
  private generateFallbackResponse(question: string): string {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('xin chào') || lowerQuestion.includes('hello') || lowerQuestion.includes('hi')) {
      return `Chào bạn! 👋 Mình là chatbot tư vấn nghề nghiệp của Đại học FPT. Rất vui được hỗ trợ bạn! 😊

Bạn có thể hỏi mình về:
• 🎓 Các chương trình đào tạo và ngành học
• 💰 Học phí và chính sách hỗ trợ
• 🏫 Thông tin các cơ sở
• 🏆 Học bổng và cơ hội việc làm

Nếu bạn có bất kỳ thắc mắc nào khác, đừng ngần ngại liên hệ với chúng mình qua:
📞 Hotline: (024) 7300 1866
📧 Email: daihocfpt@fpt.edu.vn`;
    }

    return `Xin lỗi, tôi không tìm thấy thông tin phù hợp để trả lời câu hỏi của bạn. 

Tôi có thể giúp bạn tư vấn về:
• 🎓 Các ngành học và chương trình đào tạo
• 💰 Học phí và chính sách học bổng  
• 🏫 Thông tin các cơ sở FPT University
• 💼 Cơ hội việc làm sau tốt nghiệp

Vui lòng thử hỏi cụ thể hơn hoặc liên hệ trực tiếp:
📞 Hotline: (024) 7300 1866
📧 Email: daihocfpt@fpt.edu.vn`;
  }
} 