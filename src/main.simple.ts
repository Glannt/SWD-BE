import { NestFactory } from '@nestjs/core';
import { Controller, Post, Body, Get, Res, Module } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCjqNSJz2oudMZsJkhewCyBsSQh0Iojahw';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Real Gemini embedding function
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Sử dụng Gemini để tạo embedding thực
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    
    if (result.embedding && result.embedding.values) {
      // Pad hoặc truncate để đảm bảo dimension = 1024
      const embedding = result.embedding.values;
      const targetDim = 1024;
      
      if (embedding.length >= targetDim) {
        return embedding.slice(0, targetDim);
      } else {
        // Pad với zeros nếu thiếu
        return [...embedding, ...Array(targetDim - embedding.length).fill(0)];
      }
    }
  } catch (error) {
    console.warn('⚠️ Gemini embedding failed, using fallback:', error.message);
  }
  
  // Fallback về mock embedding nếu Gemini fail
  return generateMockEmbedding(text);
}

// Mock embedding function as fallback
function generateMockEmbedding(text: string): number[] {
  const dimension = 1024;
  const vector = [];
  
  // Tạo vector dựa trên hash của text để consistent
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  for (let i = 0; i < dimension; i++) {
    vector.push((Math.sin(hash + i) + 1) / 2);
  }
  
  return vector;
}

// RAG function để query Pinecone
async function queryPineconeRAG(question: string): Promise<string> {
  try {
    // Khởi tạo Pinecone
    const apiKey = 'pcsk_6EQYWr_C4eigzszxPCoeVTuxpYJprkeTKULzr55Envq5trfw5QhiJUZ1cYGPcovKBo4J4X';
    const pc = new Pinecone({ apiKey });
    const index = pc.index('fpt-agent-truy-van-data');
    
    // Tạo embedding cho câu hỏi
    const queryVector = await generateEmbedding(question);
    
    // Query Pinecone
    const queryResponse = await index.query({
      vector: queryVector,
      topK: 3,
      includeMetadata: true
    });
    
    // Lấy context từ kết quả
    let context = '';
    if (queryResponse.matches && queryResponse.matches.length > 0) {
      context = queryResponse.matches
        .map(match => {
          if (match.metadata && match.metadata.content) {
            return `${match.metadata.title}: ${match.metadata.content}`;
          }
          return '';
        })
        .filter(text => text.length > 0)
        .join('\n\n');
    }
    
    // Nếu có context từ Pinecone, sử dụng nó
    if (context.length > 0) {
      return await generateAnswerFromContext(question, context);
    }
    
    // Fallback về câu trả lời mặc định
    return '';
    
  } catch (error) {
    console.error('❌ Lỗi khi query Pinecone:', error);
    return '';
  }
}

// Generate answer từ context using Gemini
async function generateAnswerFromContext(question: string, context: string): Promise<string> {
  try {
    // Sử dụng Gemini để tạo câu trả lời tự nhiên
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
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
    const generatedText = response.text();
    
    if (generatedText && generatedText.trim().length > 0) {
      console.log('✅ Generated answer using Gemini');
      return generatedText;
    }
  } catch (error) {
    console.warn('⚠️ Gemini generation failed, using template:', error.message);
  }
  
  // Fallback về template-based answer
  return generateTemplateAnswer(question, context);
}

// Template-based answer as fallback
function generateTemplateAnswer(question: string, context: string): string {
  const lowerQuestion = question.toLowerCase();
  
  // Phân tích câu hỏi và context để tạo câu trả lời phù hợp
  if (lowerQuestion.includes('học phí') || lowerQuestion.includes('chi phí') || lowerQuestion.includes('fee')) {
    return `💰 **THÔNG TIN HỌC PHÍ FPT UNIVERSITY**

Dựa trên dữ liệu mới nhất từ hệ thống:

${context}

📞 **Liên hệ tư vấn:** (024) 7300 1866
📧 **Email:** daihocfpt@fpt.edu.vn`;
  }
  
  if (lowerQuestion.includes('ngành') || lowerQuestion.includes('program') || lowerQuestion.includes('chương trình')) {
    return `🎓 **THÔNG TIN CHƯƠNG TRÌNH ĐÀO TẠO**

${context}

**🏢 ĐIỂM KHÁC BIỆT:**
• Chương trình OJT (On-the-Job Training) 1 học kỳ
• Thực tập tại FPT và các doanh nghiệp lớn
• Tỷ lệ có việc làm 95% sau 6 tháng tốt nghiệp`;
  }
  
  if (lowerQuestion.includes('campus') || lowerQuestion.includes('địa chỉ') || lowerQuestion.includes('cơ sở')) {
    return `🏫 **THÔNG TIN CÁC CƠ SỞ FPT UNIVERSITY**

${context}

**🏢 TIỆN ÍCH CHUNG:**
• Ký túc xá hiện đại
• Thư viện số và truyền thống  
• Phòng lab thực hành
• Sân thể thao, câu lạc bộ`;
  }
  
  if (lowerQuestion.includes('học bổng') || lowerQuestion.includes('scholarship')) {
    return `🏆 **THÔNG TIN HỌC BỔNG FPT UNIVERSITY**

${context}

📧 **Email hỗ trợ:** daihocfpt@fpt.edu.vn`;
  }
  
  if (lowerQuestion.includes('việc làm') || lowerQuestion.includes('job') || lowerQuestion.includes('career')) {
    return `💼 **CƠ HỘI VIỆC LÀM TẠI FPT UNIVERSITY**

${context}

**🌍 CƠ HỘI QUỐC TẾ:**
• Làm việc tại Nhật, Singapore, Úc
• Remote work cho các công ty nước ngoài`;
  }
  
  // Câu trả lời chung với context
  return `📋 **THÔNG TIN FPT UNIVERSITY**

${context}

Để biết thêm chi tiết, vui lòng liên hệ:
📞 **Hotline:** (024) 7300 1866
📧 **Email:** daihocfpt@fpt.edu.vn`;
}

@Controller()
class ChatController {
  @Get()
  getHome(@Res() res: Response) {
    return res.sendFile(path.join(process.cwd(), 'public', 'index-simple.html'));
  }
  
  @Get('index-simple.html')
  getChat(@Res() res: Response) {
    return res.sendFile(path.join(process.cwd(), 'public', 'index-simple.html'));
  }
  
  @Post('ask')
  async ask(@Body() body: any) {
    console.log('📝 Received question:', body.question);
    
    const question = body.question?.trim() || '';
    
    if (!question) {
      return {
        answer: 'Vui lòng nhập câu hỏi của bạn! 😊'
      };
    }
    
    // Lời chào đặc biệt
    if (question.toLowerCase().includes('xin chào') || question.toLowerCase().includes('hello')) {
      return {
        answer: `Xin chào! 👋 Tôi là chatbot tư vấn nghề nghiệp của FPT University.

🤖 **Tôi sử dụng công nghệ RAG + Pinecone** để trả lời dựa trên dữ liệu chính thức từ file Information_FPTU.docx

Tôi có thể giúp bạn tìm hiểu về:
🎓 Các chương trình đào tạo (9 ngành chính)
💰 Học phí chi tiết theo từng ngành và campus
🏆 Học bổng và hỗ trợ tài chính
🏫 5 cơ sở tại Hà Nội, HCM, Đà Nẵng, Cần Thơ, Quy Nhon
📋 Tuyển sinh và điều kiện nhập học
💼 Cơ hội việc làm và thực tập OJT

Bạn muốn tìm hiểu về vấn đề gì?`
      };
    }
    
    // Sử dụng RAG để query Pinecone
    console.log('🔍 Querying Pinecone with RAG...');
    const ragAnswer = await queryPineconeRAG(question);
    
    if (ragAnswer) {
      console.log('✅ Found answer from Pinecone RAG');
      return { answer: ragAnswer };
    }
    
    // Fallback về câu trả lời mặc định nếu RAG không có kết quả
    console.log('⚠️ No RAG result, using fallback');
    return {
      answer: `Cảm ơn bạn đã liên hệ với FPT University! 🎓

🔍 **Tôi đang tìm kiếm thông tin về:** "${question}"

Tôi có thể giúp bạn tìm hiểu chi tiết về:

🎯 **Các chủ đề chính:**
• **"học phí"** - Bảng giá chi tiết 9 ngành học
• **"ngành học"** - Thông tin 9 chương trình đào tạo  
• **"học bổng"** - 4 loại học bổng và điều kiện
• **"campus"** - 5 cơ sở trên toàn quốc
• **"tuyển sinh"** - Điều kiện và hình thức tuyển sinh
• **"việc làm"** - Cơ hội nghề nghiệp và chương trình OJT

**📊 THỐNG KÊ NỔI BẬT:**
• 95% sinh viên có việc làm sau 6 tháng
• Lương khởi điểm 8-15 triệu VNĐ/tháng
• 80% sinh viên được mời ở lại sau OJT
• 32.000+ alumni đang làm việc toàn cầu

Vui lòng đặt câu hỏi cụ thể để tôi hỗ trợ bạn tốt hơn! 😊

📞 **Hotline tư vấn:** (024) 7300 1866
📧 **Email:** daihocfpt@fpt.edu.vn`
    };
  }
}

@Module({
  controllers: [ChatController],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📡 API endpoint: http://localhost:3000/ask');
  console.log('🤖 RAG enabled with Pinecone vector database');
  console.log('📋 Data source: Information_FPTU.docx (32 vectors)');
}

bootstrap(); 