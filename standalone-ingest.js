const { MongoClient } = require('mongodb');
const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

/**
 * Standalone MongoDB to Pinecone Ingestion Script
 * Bypasses NestJS dependency issues by using direct connections
 */
class StandaloneIngest {
  constructor() {
    this.mongoClient = new MongoClient(process.env.MONGODB_URI);
    this.pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
  }

  async validateConfiguration() {
    console.log('🔧 Validating Configuration...');
    
    const required = {
      'MONGODB_URI': process.env.MONGODB_URI,
      'PINECONE_API_KEY': process.env.PINECONE_API_KEY,
      'PINECONE_INDEX_NAME': process.env.PINECONE_INDEX_NAME,
      'GEMINI_API_KEY': process.env.GEMINI_API_KEY
    };
    
    for (const [key, value] of Object.entries(required)) {
      if (!value) {
        throw new Error(`❌ Missing required environment variable: ${key}`);
      }
      console.log(`✅ ${key}: Configured`);
    }
    
    return true;
  }

  async connectMongoDB() {
    console.log('\n🗄️ Connecting to MongoDB...');
    await this.mongoClient.connect();
    
    const dbName = process.env.MONGODB_URI.split('/').pop()?.split('?')[0] || 'FchatCareer';
    this.db = this.mongoClient.db(dbName);
    console.log(`✅ Connected to database: ${dbName}`);
    
    return this.db;
  }

  async getDataStatistics() {
    console.log('\n📊 Analyzing MongoDB Data...');
    
    const collections = ['campuses', 'majors', 'tuitionfees', 'scholarships'];
    const stats = {};
    let totalRecords = 0;
    
    for (const collectionName of collections) {
      try {
        const count = await this.db.collection(collectionName).countDocuments();
        stats[collectionName] = count;
        totalRecords += count;
        
        const icon = {
          'campuses': '🏫',
          'majors': '🎓',
          'tuitionfees': '💰', 
          'scholarships': '🏆'
        }[collectionName];
        
        console.log(`   ${icon} ${collectionName}: ${count} records`);
      } catch (error) {
        console.log(`   ❌ ${collectionName}: Error - ${error.message}`);
        stats[collectionName] = 0;
      }
    }
    
    console.log(`   ═══════════════════════════════`);
    console.log(`   📝 Total Records: ${totalRecords}`);
    
    if (totalRecords === 0) {
      throw new Error('No data found in MongoDB collections!');
    }
    
    return { stats, totalRecords };
  }

  async getAllDataAsChunks() {
    console.log('\n📄 Converting MongoDB data to text chunks...');
    const chunks = [];

    // Process campuses
    const campuses = await this.db.collection('campuses').find().toArray();
    for (const campus of campuses) {
      const text = `
        Tên campus: ${campus.Name}
        Địa chỉ: ${campus.Address}
        Thông tin liên hệ: ${campus.ContactInfo}
        Mô tả nổi bật: ${campus.DescriptionHighlights}
      `.trim();

      chunks.push({
        text,
        metadata: {
          type: 'campus',
          name: campus.Name,
          id: campus._id.toString(),
        },
      });
    }

    // Process majors
    const majors = await this.db.collection('majors').find().toArray();
    for (const major of majors) {
      const text = `
        Tên ngành: ${major.Name}
        Mô tả: ${major.Description}
        Cơ hội nghề nghiệp: ${major.CareerOpportunities}
        Yêu cầu tuyển sinh: ${major.GeneralAdmissionRequirements || 'Không có thông tin'}
        Thời gian đào tạo: ${major.ProgramDuration || 'Không có thông tin'}
      `.trim();

      chunks.push({
        text,
        metadata: {
          type: 'major',
          name: major.Name,
          id: major._id.toString(),
        },
      });
    }

    // Process scholarships  
    const scholarships = await this.db.collection('scholarships').find().toArray();
    for (const scholarship of scholarships) {
      const text = `
        Tên học bổng: ${scholarship.Name}
        Mô tả: ${scholarship.Description}
        Giá trị: ${scholarship.Value || 'Chưa xác định'}
        Yêu cầu: ${scholarship.Requirements || 'Không có thông tin'}
      `.trim();

      chunks.push({
        text,
        metadata: {
          type: 'scholarship',
          name: scholarship.Name,
          id: scholarship._id.toString(),
        },
      });
    }

    console.log(`✅ Generated ${chunks.length} chunks from MongoDB data`);
    return chunks;
  }

  async createEmbedding(text) {
    try {
      const result = await this.model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('❌ Error creating embedding:', error.message);
      throw error;
    }
  }

  async processChunksToVectors(chunks) {
    console.log(`\n🧠 Creating embeddings for ${chunks.length} chunks...`);
    
    const indexName = process.env.PINECONE_INDEX_NAME;
    const index = this.pinecone.index(indexName);
    
    let processedCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`);
      
      const vectors = [];
      
      for (const chunk of batch) {
        try {
          const embedding = await this.createEmbedding(chunk.text);
          
          const vector = {
            id: uuidv4(),
            values: embedding,
            metadata: {
              ...chunk.metadata,
              text: chunk.text,
              source: 'mongodb-standalone',
              timestamp: new Date().toISOString(),
            },
          };
          
          vectors.push(vector);
          processedCount++;
          
        } catch (embeddingError) {
          console.error(`❌ Error creating embedding for chunk:`, embeddingError.message);
          continue;
        }
      }
      
      // Upsert batch to Pinecone
      if (vectors.length > 0) {
        try {
          await index.upsert(vectors);
          console.log(`✅ Upserted ${vectors.length} vectors to Pinecone`);
        } catch (pineconeError) {
          console.error('❌ Error upserting to Pinecone:', pineconeError.message);
        }
      }
      
      // Rate limiting delay
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Completed processing ${processedCount}/${chunks.length} chunks`);
    return processedCount;
  }

  async run() {
    console.log('🚀 Standalone MongoDB to Pinecone Ingestion');
    console.log('💡 Bypassing NestJS dependencies for direct integration\n');
    
    try {
      // Validate configuration
      await this.validateConfiguration();
      
      // Connect to MongoDB
      await this.connectMongoDB();
      
      // Get data statistics
      const { stats, totalRecords } = await this.getDataStatistics();
      
      // Get chunks from MongoDB
      const chunks = await this.getAllDataAsChunks();
      
      // Process to vectors
      const startTime = Date.now();
      const processedCount = await this.processChunksToVectors(chunks);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Success summary
      console.log('\n🎉 Ingestion Completed Successfully!');
      console.log('═══════════════════════════════════');
      console.log(`⏱️  Duration: ${duration} seconds`);
      console.log(`📥 Source: MongoDB (${totalRecords} records)`);
      console.log(`🧠 Chunks processed: ${processedCount}`);
      console.log(`🎯 Vector database: Updated`);
      console.log(`✅ Status: Ready for chatbot`);
      
      console.log('\n📝 Next Steps:');
      console.log('1. 🚀 Start chatbot: pnpm run start:dev');
      console.log('2. 🌐 Access: http://localhost:3000');
      console.log('3. 🧪 Test with FPT University questions');
      
    } catch (error) {
      console.error('\n💥 Ingestion Failed:', error.message);
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check .env file configuration');
      console.log('2. Verify all services are accessible');
      console.log('3. Ensure MongoDB has data');
      console.log('4. Check API keys and quotas');
      
      process.exit(1);
    } finally {
      if (this.mongoClient) {
        await this.mongoClient.close();
        console.log('\n👋 MongoDB connection closed.');
      }
    }
  }
}

// Run the standalone ingestion
const ingest = new StandaloneIngest();
ingest.run().catch(console.error); 