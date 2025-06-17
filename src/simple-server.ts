import express from 'express';
import * as path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// CORS middleware (thủ công)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'fpt-university-768d';

console.log('🔧 Configuration:');
console.log('- Port:', PORT);
console.log('- Gemini API Key:', GEMINI_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('- Pinecone API Key:', PINECONE_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('- Pinecone Index:', PINECONE_INDEX_NAME);

// Initialize services
let genAI: GoogleGenerativeAI;
let pc: Pinecone;
let index: any;

// Initialize AI services
try {
  if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('✅ Gemini AI initialized');
  } else {
    throw new Error('GEMINI_API_KEY not configured');
  }

  if (PINECONE_API_KEY) {
    pc = new Pinecone({ apiKey: PINECONE_API_KEY });
    index = pc.index(PINECONE_INDEX_NAME);
    console.log('✅ Pinecone initialized');
  } else {
    throw new Error('PINECONE_API_KEY not configured');
  }
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  process.exit(1);
}

// Generate embedding function
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    
    if (result.embedding && result.embedding.values) {
      const embedding = result.embedding.values;
      console.log('📊 Generated embedding with dimension:', embedding.length);
      return embedding;
    }
  } catch (error) {
    console.warn('⚠️ Gemini embedding failed, using fallback:', error.message);
  }
  
  // Fallback to mock embedding
  return generateMockEmbedding(text);
}

// Mock embedding function (768D native)
function generateMockEmbedding(text: string): number[] {
  const dimension = 768; // Native Gemini dimension
  const vector = [];
  
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  for (let i = 0; i < dimension; i++) {
    vector.push((Math.sin(hash + i) + 1) / 2);
  }
  
  console.log('📊 Generated mock embedding with dimension:', dimension);
  return vector;
}

// Query Pinecone RAG function
async function queryPineconeRAG(question: string): Promise<string> {
  try {
    console.log('🔍 Querying for:', question);
    
    // Generate embedding for question
    const queryVector = await generateEmbedding(question);
    
    // Query Pinecone
    const queryResponse = await index.query({
      vector: queryVector,
      topK: 3,
      includeMetadata: true
    });
    
    console.log('📊 Found', queryResponse.matches?.length || 0, 'matches');
    
    // Extract context from results  
    let context = '';
    if (queryResponse.matches && queryResponse.matches.length > 0) {
      context = queryResponse.matches
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
    
    // Generate answer if we have context
    if (context.length > 0) {
      return await generateAnswerFromContext(question, context);
    }
    
    return 'Xin lỗi, tôi không tìm thấy thông tin phù hợp để trả lời câu hỏi của bạn. Vui lòng thử hỏi về học phí, ngành học, cơ sở, học bổng hoặc cơ hội việc làm tại FPT University.';
    
  } catch (error) {
    console.error('❌ Error querying Pinecone:', error);
    return 'Đã xảy ra lỗi khi tìm kiếm thông tin. Vui lòng thử lại sau.';
  }
}

// Generate answer from context using Gemini
async function generateAnswerFromContext(question: string, context: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
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
  
  // Fallback to template-based answer
  return generateTemplateAnswer(question, context);
}

// Template-based answer as fallback
function generateTemplateAnswer(question: string, context: string): string {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('học phí') || lowerQuestion.includes('chi phí')) {
    return `💰 **THÔNG TIN HỌC PHÍ FPT UNIVERSITY**

${context}

📞 **Liên hệ tư vấn:** (024) 7300 1866
📧 **Email:** daihocfpt@fpt.edu.vn`;
  }
  
  if (lowerQuestion.includes('ngành') || lowerQuestion.includes('chương trình')) {
    return `🎓 **THÔNG TIN CHƯƠNG TRÌNH ĐÀO TẠO**

${context}

**🏢 ĐIỂM KHÁC BIỆT:**
• Chương trình OJT (On-the-Job Training) 1 học kỳ
• Thực tập tại FPT và các doanh nghiệp lớn
• Tỷ lệ có việc làm 95% sau 6 tháng tốt nghiệp

📞 **Liên hệ:** (024) 7300 1866`;
  }
  
  if (lowerQuestion.includes('campus') || lowerQuestion.includes('cơ sở')) {
    return `🏫 **THÔNG TIN CÁC CƠ SỞ FPT UNIVERSITY**

${context}

📞 **Liên hệ:** (024) 7300 1866`;
  }
  
  return `📚 **THÔNG TIN FPT UNIVERSITY**

${context}

📞 **Liên hệ:** (024) 7300 1866 để biết thêm chi tiết.`;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'FPT University Chatbot',
    version: '1.0.0',
    configuration: {
      gemini: !!GEMINI_API_KEY,
      pinecone: !!PINECONE_API_KEY,
      index: PINECONE_INDEX_NAME
    }
  });
});

app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        error: 'Vui lòng cung cấp câu hỏi hợp lệ',
        message: 'Question is required and must be a string'
      });
    }
    
    console.log('💬 Received question:', question);
    
    const answer = await queryPineconeRAG(question);
    
    res.json({
      answer,
      timestamp: new Date().toISOString(),
      question: question
    });
    
  } catch (error) {
    console.error('❌ Error processing question:', error);
    res.status(500).json({
      error: 'Đã xảy ra lỗi khi xử lý câu hỏi',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ==================== SERVER STARTED ====================');
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`💬 Chat interface: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API endpoint: http://localhost:${PORT}/ask`);
  console.log('=========================================================');
  console.log('');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
}); 