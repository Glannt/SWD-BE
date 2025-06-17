import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

// Đảm bảo biến môi trường được đọc
dotenv.config();

@Injectable()
export class PineconeService implements OnModuleInit {
  private pinecone: Pinecone;
  private indexName: string;

  constructor() {
    // Lấy thông tin từ biến môi trường
    const apiKey = process.env.PINECONE_API_KEY;
    this.indexName = process.env.PINECONE_INDEX_NAME || 'fpt-university-768d';
    
    console.log('Pinecone API Key:', apiKey ? 'Đã cấu hình (độ dài: ' + apiKey.length + ')' : 'Chưa cấu hình');
    console.log('Pinecone Index Name:', this.indexName);
    
    // Khởi tạo client Pinecone
    this.pinecone = new Pinecone({
      apiKey: apiKey || 'pcsk_7ACs6N_L5KeAoJhycf6J67t7VkKiukQNQPg8kaF48FS1dVFjswwwUMfg25ETYSKJdroLLw',
    });
  }

  async onModuleInit() {
    try {
      // Kiểm tra xem index đã tồn tại hay chưa
      const indexes = await this.pinecone.listIndexes();
      const indexNames = indexes.indexes?.map(index => index.name) || [];
      const indexExists = indexNames.includes(this.indexName);

      // Nếu index chưa tồn tại, tạo mới
      if (!indexExists) {
        console.log(`Đang tạo index mới: ${this.indexName}`);
        
        // Tạo index với cấu hình phù hợp cho RAG
        // Lưu ý: Không tạo index trong code vì yêu cầu quyền admin
        // Index nên được tạo trước qua giao diện web Pinecone
        console.log(`Không thể tạo index tự động. Vui lòng tạo index ${this.indexName} qua giao diện Pinecone với dimension 768.`);
      } else {
        console.log(`Index ${this.indexName} đã tồn tại`);
      }
    } catch (error) {
      console.error('Lỗi khi khởi tạo Pinecone:', error);
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
    const index = await this.getIndex();
    await index.upsert(vectors);
  }

  /**
   * Tìm kiếm vector gần nhất
   * @param vector Vector tìm kiếm
   * @param topK Số lượng kết quả trả về
   * @returns Danh sách vector gần nhất
   */
  async queryVectors(vector: number[], topK: number = 3) {
    const index = await this.getIndex();
    
    const queryResult = await index.query({
      vector,
      topK,
      includeMetadata: true,
    });
    
    return queryResult.matches;
  }
} 