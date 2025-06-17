import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

// Load environment variables
dotenv.config();

async function testConfiguration() {
  console.log('🔧 ==================== TEST CONFIGURATION ====================');
  console.log('');

  // Test 1: Environment Variables
  console.log('1️⃣ **KIỂM TRA BIẾN MÔI TRƯỜNG:**');
  console.log('PORT:', process.env.PORT || 'Chưa cấu hình');
  console.log('GLOBAL_PREFIX:', process.env.GLOBAL_PREFIX || 'Chưa cấu hình');
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Đã cấu hình' : '❌ Chưa cấu hình');
  console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? '✅ Đã cấu hình' : '❌ Chưa cấu hình');
  console.log('PINECONE_INDEX_NAME:', process.env.PINECONE_INDEX_NAME || 'Chưa cấu hình');
  console.log('');

  // Test 2: Gemini AI Connection
  console.log('2️⃣ **KIỂM TRA GEMINI AI:**');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    console.log('📝 Đang test embedding...');
    const result = await model.embedContent('Test connection to Gemini AI');
    
    if (result.embedding && result.embedding.values) {
      console.log('✅ Gemini AI hoạt động bình thường');
      console.log('📊 Embedding dimension:', result.embedding.values.length);
    } else {
      console.log('❌ Gemini AI trả về kết quả không đúng định dạng');
    }
  } catch (error) {
    console.log('❌ Lỗi kết nối Gemini AI:', error.message);
  }
  console.log('');

  // Test 3: Pinecone Connection
  console.log('3️⃣ **KIỂM TRA PINECONE:**');
  try {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    
    console.log('📝 Đang kiểm tra danh sách indexes...');
    const indexes = await pc.listIndexes();
    console.log('✅ Kết nối Pinecone thành công');
    console.log('📊 Số lượng indexes:', indexes.indexes?.length || 0);
    
    if (indexes.indexes && indexes.indexes.length > 0) {
      console.log('📋 Danh sách indexes:');
      indexes.indexes.forEach((index, i) => {
        console.log(`   ${i + 1}. ${index.name} (dimension: ${index.dimension})`);
      });
    }

    // Kiểm tra index cụ thể
    const targetIndex = process.env.PINECONE_INDEX_NAME;
    const indexExists = indexes.indexes?.some(index => index.name === targetIndex);
    
    if (indexExists) {
      console.log(`✅ Index "${targetIndex}" tồn tại`);
      
      // Test query
      console.log('📝 Đang test query...');
      const index = pc.index(targetIndex);
      const queryResult = await index.query({
        vector: Array(768).fill(0.1), // Test vector
        topK: 1,
        includeMetadata: true
      });
      
      console.log('✅ Query thành công');
      console.log('📊 Số kết quả:', queryResult.matches?.length || 0);
    } else {
      console.log(`❌ Index "${targetIndex}" không tồn tại`);
    }
    
  } catch (error) {
    console.log('❌ Lỗi kết nối Pinecone:', error.message);
  }
  console.log('');

  // Test 4: Full RAG Pipeline
  console.log('4️⃣ **KIỂM TRA PIPELINE RAG:**');
  try {
    // Create embedding
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    const testQuestion = "Học phí FPT University là bao nhiêu?";
    console.log(`📝 Test câu hỏi: "${testQuestion}"`);
    
    const embeddingResult = await embeddingModel.embedContent(testQuestion);
    const queryVector = embeddingResult.embedding.values;
    
    // Query Pinecone
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.index(process.env.PINECONE_INDEX_NAME!);
    
    const queryResult = await index.query({
      vector: queryVector,
      topK: 3,
      includeMetadata: true
    });
    
    console.log('✅ RAG Pipeline hoạt động bình thường');
    console.log('📊 Tìm thấy', queryResult.matches?.length || 0, 'kết quả liên quan');
    
    if (queryResult.matches && queryResult.matches.length > 0) {
      console.log('📋 Top results:');
      queryResult.matches.slice(0, 2).forEach((match, i) => {
        const score = match.score ? (match.score * 100).toFixed(1) : 'N/A';
        const text = match.metadata?.text ? String(match.metadata.text).substring(0, 100) : 'No text';
        console.log(`   ${i + 1}. (${score}%) ${text}...`);
      });
    }

  } catch (error) {
    console.log('❌ Lỗi RAG Pipeline:', error.message);
  }
  console.log('');

  console.log('🎯 **TỔNG KẾT:**');
  console.log('Nếu tất cả đều ✅, bạn có thể chạy server bằng:');
  console.log('   pnpm run start:dev   (NestJS mode)');
  console.log('hoặc');
  console.log('   pnpm run simple      (Simple server mode)');
  console.log('');
  console.log('Sau đó truy cập: http://localhost:3000');
}

// Run the test
testConfiguration().catch(console.error); 