import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import { ConfigService } from '../../config/config.service';

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
      console.log('🔍 Checking Pinecone index...');
      const indexes = await this.pinecone.listIndexes();
      const indexNames = indexes.indexes?.map(index => index.name) || [];
      const indexExists = indexNames.includes(this.indexName);

      if (indexExists) {
        console.log(`✅ Index "${this.indexName}" exists and ready`);
      } else {
        console.warn(`⚠️ Index "${this.indexName}" not found. Available indexes:`, indexNames);
        console.log('💡 Please create the index via Pinecone console with dimension 768');
      }
    } catch (error) {
      console.error('❌ Error initializing Pinecone:', error);
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
  async queryVectors(vector: number[], topK: number = 3) {
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