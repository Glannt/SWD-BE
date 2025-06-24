import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import { ConfigService } from '../config/config.service';

@Injectable()
export class PineconeService implements OnModuleInit {
  private pinecone: Pinecone;
  private indexName: string;

  constructor(private configService: ConfigService) {
    // Lấy thông tin từ ConfigService
    const apiKey = this.configService.getPineconeApiKey();
    this.indexName = this.configService.getPineconeIndexName();

    if (!apiKey) {
      throw new Error('PINECONE_API_KEY is required but not configured');
    }

    console.log('✅ Pinecone initialized with ConfigService');
    console.log('📊 Index Name:', this.indexName);

    // Khởi tạo client Pinecone
    this.pinecone = new Pinecone({
      apiKey: apiKey,
    });
  }

  async onModuleInit() {
    try {
      // Kiểm tra xem index đã tồn tại hay chưa
      console.log('🔍 Checking for Pinecone index:', this.indexName);
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes?.some(i => i.name === this.indexName);

      if (indexExists) {
        console.log(`✅ Index "${this.indexName}" found. Verifying details...`);
        const description = await this.pinecone.describeIndex(this.indexName);
        console.log(`📊 Index Details: Dimension=${description.dimension}, Metric=${description.metric}`);

        if (description.dimension !== 768 || description.metric !== 'cosine') {
            console.error(`❌ Configuration Mismatch:`);
            console.error(`   - Expected Dimension: 1024 (Actual: ${description.dimension})`);
            console.error(`   - Expected Metric: 'cosine' (Actual: ${description.metric})`);
            throw new Error('Pinecone index configuration does not match required settings.');
        }

        console.log('👍 Index configuration is correct. Ready for connection.');

      } else {
        const indexNames = indexes.indexes?.map(i => i.name) || [];
        console.error(`❌ Critical: Index "${this.indexName}" not found on Pinecone.`);
        console.log('📋 Available indexes in your project:', indexNames.length > 0 ? indexNames.join(', ') : 'None');
        console.log('🔧 Please verify that the `PINECONE_INDEX_NAME` in your .env file is correct and the index exists.');
        throw new Error(`Pinecone index "${this.indexName}" not found.`);
      }
    } catch (error) {
      console.error('❌ Error initializing Pinecone:', error.message);
      throw error;
    }
  }

  /**
   * Lấy index từ Pinecone
   */
  async getIndex() {
    return this.pinecone.index(this.indexName);
  }

  /**
   * Thêm vector vào Pinecone
   * @param vectors Danh sách các vector cần thêm
   */
  async upsertVectors(vectors: any[]) {
    try {
      const index = await this.getIndex();
      await index.upsert(vectors);
      console.log(`✅ Successfully upserted ${vectors.length} vectors`);
    } catch (error) {
      console.error('❌ Error upserting vectors:', error);
      throw error;
    }
  }

  /**
   * Tìm kiếm vector gần nhất
   * @param vector Vector tìm kiếm
   * @param topK Số lượng kết quả trả về
   * @returns Danh sách vector gần nhất
   */
  async queryVectors(vector: number[], topK: number = 10) {
    try {
      const index = await this.getIndex();

      const queryResult = await index.query({
        vector,
        topK,
        includeMetadata: true,
      });

      console.log(`🔍 Found ${queryResult.matches?.length || 0} relevant matches`);
      return queryResult.matches;
    } catch (error) {
      console.error('❌ Error querying vectors:', error);
      throw error;
    }
  }
}