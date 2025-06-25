import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import { MongoDbDataService } from '../../mongo/mongo.service';
import { PineconeService } from '../../pinecone/pinecone.service';
import { GeminiService } from '../../gemini/gemini.service';

// Load environment variables
dotenv.config();

@Injectable()
export class IngestService {
  constructor(
    private readonly pineconeService: PineconeService,
    private readonly geminiService: GeminiService,
    private readonly mongoDbDataService: MongoDbDataService,
  ) {}

  /**
   * Lấy dữ liệu từ MongoDB và chuyển đổi thành chunks
   * @returns Danh sách các đoạn văn bản từ MongoDB
   */
  async getMongoDbChunks(): Promise<{ text: string; metadata: any }[]> {
    try {
      console.log('📂 Đang lấy dữ liệu từ MongoDB...');

      // Lấy thống kê trước để kiểm tra
      const stats = await this.mongoDbDataService.getDataStatistics();
      console.log('📊 Thống kê dữ liệu MongoDB:', stats);

      if (stats.campuses === 0 && stats.majors === 0 && stats.tuitionFees === 0 && stats.scholarships === 0) {
        throw new Error(`
          ❌ MongoDB không có dữ liệu!

          🔧 Vui lòng kiểm tra:
          1. Kết nối MongoDB đúng chưa
          2. Database name đúng chưa
          3. Collections đã được tạo chưa
          4. Dữ liệu đã được import vào MongoDB chưa

          📞 Liên hệ admin để import dữ liệu vào MongoDB.
        `);
      }

      console.log(`✅ MongoDB có dữ liệu: ${stats.campuses} campus, ${stats.majors} major, ${stats.tuitionFees} tuition, ${stats.scholarships} scholarship`);

      // Lấy tất cả dữ liệu và chuyển thành chunks
      const chunks = await this.mongoDbDataService.getAllDataAsChunks2();
      console.log(`📄 Đã tạo ${chunks.length} chunks từ dữ liệu MongoDB có sẵn`);

      return chunks;
    } catch (error) {
      console.error('❌ Lỗi khi lấy dữ liệu từ MongoDB:', error);
      throw error;
    }
  }

  /**
   * Xử lý dữ liệu từ MongoDB và lưu vào Pinecone
   * @returns Số lượng đoạn đã xử lý
   */
  async ingestFromMongoDB(): Promise<number> {
    try {
      console.log('🔄 Bắt đầu ingest dữ liệu từ MongoDB có sẵn...');

      // Lấy dữ liệu từ MongoDB
      const chunks = await this.getMongoDbChunks();

      if (chunks.length === 0) {
        console.log('⚠️ Không có chunks để xử lý');
        return 0;
      }

      return await this.processChunksToVectors(chunks, 'mongodb');
    } catch (error) {
      console.error('❌ Lỗi khi ingest từ MongoDB:', error);
      throw error;
    }
  }

  /**
   * Main ingest method - chỉ sử dụng dữ liệu có sẵn trong MongoDB
   * @returns Số lượng đoạn đã xử lý từ MongoDB
   */
  async ingestData(): Promise<number> {
    try {
      console.log('🚀 Bắt đầu quá trình ingest dữ liệu từ MongoDB...');
      console.log('💡 Hệ thống sẽ sử dụng dữ liệu có sẵn trong MongoDB (không cần seed từ JSON)');

      // Kiểm tra kết nối và dữ liệu MongoDB
      const stats = await this.mongoDbDataService.getDataStatistics();
      console.log('📊 Kiểm tra dữ liệu hiện có:', stats);

      const totalRecords = stats.campuses + stats.majors + stats.tuitionFees + stats.scholarships;

      if (totalRecords === 0) {
        throw new Error(`
          ❌ MongoDB không có dữ liệu để ingest!

          📊 Hiện tại: 0 records trong tất cả collections

          🔧 Cần thực hiện:
          1. Kiểm tra kết nối MongoDB
          2. Đảm bảo database name đúng (${process.env.MONGODB_URI})
          3. Import dữ liệu vào MongoDB từ nguồn khác
          4. Kiểm tra permissions đọc database

          💡 Lưu ý: Hệ thống không còn sử dụng JSON file nữa, chỉ lấy từ MongoDB.
        `);
      }

      console.log(`✅ Tìm thấy ${totalRecords} records trong MongoDB:`);
      console.log(`   - 🏫 ${stats.campuses} campuses`);
      console.log(`   - 🎓 ${stats.majors} majors`);
      console.log(`   - 💰 ${stats.tuitionFees} tuition fees`);
      console.log(`   - 🏆 ${stats.scholarships} scholarships`);

      // Ingest từ MongoDB
      const processedChunks = await this.ingestFromMongoDB();

      console.log('✅ Hoàn thành ingest dữ liệu từ MongoDB!');
      console.log(`📊 Đã xử lý ${processedChunks} chunks từ ${totalRecords} records`);
      console.log('🎯 Vector database đã được cập nhật với dữ liệu realtime từ MongoDB');

      return processedChunks;

    } catch (error) {
      console.error('❌ Lỗi trong quá trình ingest:', error);
      throw error;
    }
  }

  /**
   * Xử lý các chunks thành vectors và lưu vào Pinecone
   * @param chunks Danh sách chunks cần xử lý
   * @param source Nguồn dữ liệu (mongodb)
   * @returns Số lượng chunks đã xử lý thành công
   */
  private async processChunksToVectors(chunks: { text: string; metadata: any }[], source: string): Promise<number> {
    try {
      console.log(`🔄 Bắt đầu tạo embeddings cho ${chunks.length} chunks từ ${source}...`);

      let processedCount = 0;
      const batchSize = 10; // Xử lý theo batch để tránh rate limit

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        console.log(`📦 Đang xử lý batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`);

        const vectors = [];

        for (const chunk of batch) {
          try {
            // Tạo embedding
            const embedding = await this.geminiService.createEmbedding(chunk.text);

            // Tạo vector
            const vector = {
              id: uuidv4(),
              values: embedding,
              metadata: {
                ...chunk.metadata,
                text: chunk.text,
                source: source,
                timestamp: new Date().toISOString(),
                ingestedFrom: 'mongodb-realtime'
              },
            };

            vectors.push(vector);
            processedCount++;

          } catch (embeddingError) {
            console.error(`❌ Lỗi tạo embedding cho chunk:`, embeddingError);
            continue;
          }
        }

        // Lưu batch vào Pinecone
        if (vectors.length > 0) {
          try {
            await this.pineconeService.upsertVectors(vectors);
            console.log(`✅ Đã lưu ${vectors.length} vectors vào Pinecone`);
          } catch (pineconeError) {
            console.error('❌ Lỗi lưu vào Pinecone:', pineconeError);
          }
        }

        // Delay giữa các batch để tránh rate limit
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`✅ Hoàn thành xử lý ${processedCount}/${chunks.length} chunks từ ${source}`);
      return processedCount;

    } catch (error) {
      console.error(`❌ Lỗi xử lý chunks từ ${source}:`, error);
      throw error;
    }
  }

  /**
   * Kiểm tra trạng thái dữ liệu và kết nối
   * @returns Thông tin trạng thái chi tiết
   */
  async checkDataStatus(): Promise<{
    mongodb: { status: string; stats: any; message?: string };
    pinecone: { status: string; message?: string };
    recommendation: string;
  }> {
    const result = {
      mongodb: { status: 'unknown', stats: {}, message: undefined as string | undefined },
      pinecone: { status: 'unknown', message: undefined as string | undefined },
      recommendation: '',
    };

    // Kiểm tra MongoDB
    try {
      const stats = await this.mongoDbDataService.getDataStatistics();
      const totalRecords = stats.campuses + stats.majors + stats.tuitionFees + stats.scholarships;

      if (totalRecords > 0) {
        result.mongodb = {
          status: 'healthy',
          stats,
          message: `✅ ${totalRecords} records available`
        };
      } else {
        result.mongodb = {
          status: 'empty',
          stats,
          message: '⚠️ No data found in MongoDB'
        };
      }
    } catch (error) {
      result.mongodb = {
        status: 'error',
        stats: {},
        message: `❌ Connection failed: ${error.message}`
      };
    }

    // Kiểm tra Pinecone
    try {
      // The connection is already verified in onModuleInit, so a simple check is enough.
      // We can describe the index again to confirm it's reachable.
      await this.pineconeService.getIndex(); // A lightweight check
      result.pinecone = {
        status: 'healthy',
        message: '✅ Connected and operational'
      };
    } catch (error) {
      result.pinecone = {
        status: 'error',
        message: `❌ Connection failed: ${error.message}`
      };
    }

    // Đưa ra khuyến nghị
    if (result.mongodb.status === 'empty') {
      result.recommendation = '📥 Import dữ liệu vào MongoDB từ admin panel hoặc data source khác';
    } else if (result.mongodb.status === 'healthy' && result.pinecone.status === 'healthy') {
      result.recommendation = '✅ Sẵn sàng chạy "pnpm run ingest" để đồng bộ dữ liệu MongoDB với vector database';
    } else if (result.mongodb.status === 'healthy' && result.pinecone.status === 'error') {
      result.recommendation = '🔧 Kiểm tra cấu hình Pinecone API key và index name';
    } else {
      result.recommendation = '🔧 Kiểm tra kết nối MongoDB và Pinecone';
    }

    return result;
  }
}
