import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ConfigService } from '../config/config.service';

// Định nghĩa interface cho document payload
export interface DocumentPayload {
  text: string;
  metadata: {
    source: string;
    chunk_index: number;
  };
}

// Định nghĩa interface cho document để add vào Qdrant
export interface QdrantDocument {
  id: string;
  vector: number[];
  payload: {
    text: string;
    metadata: {
      source: string;
      chunk_index: number;
    };
  };
}

// Định nghĩa interface cho SearchResult
export interface SearchResult {
  id: string | number;
  score: number;
  payload: Record<string, any>;
  version?: number;
}

// Định nghĩa interface cho kết quả thao tác
export interface OperationResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private client: QdrantClient;
  private readonly logger = new Logger(QdrantService.name);
  private readonly collectionName = 'career_guidance';
  private readonly vectorSize = 768; // Phù hợp với kích thước embedding mặc định

  constructor(private configService: ConfigService) {
    this.client = new QdrantClient({
      url: this.configService.getQdrantUrl(),
      apiKey: this.configService.getQdrantApiKey(),
    });
  }

  async onModuleInit() {
    try {
      // Kiểm tra xem collection đã tồn tại chưa
      const collections = await this.client.getCollections();
      const collectionExists = collections.collections.some(
        (collection) => collection.name === this.collectionName,
      );

      if (!collectionExists) {
        await this.createCollection();
      }
      this.logger.log(`Connected to Qdrant collection: ${this.collectionName}`);
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(
        `Failed to initialize Qdrant connection: ${errorMessage}`,
      );
      throw error;
    }
  }

  private async createCollection(): Promise<void> {
    try {
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: this.vectorSize,
          distance: 'Cosine',
        },
      });
      this.logger.log(`Created collection: ${this.collectionName}`);
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Failed to create collection: ${errorMessage}`);
      throw error;
    }
  }

  async addDocuments(
    documents: QdrantDocument[],
  ): Promise<OperationResult> {
    try {
      // Qdrant API yêu cầu một mảng các points có cấu trúc nhất định
      const points = documents.map((doc) => ({
        id: doc.id,
        vector: doc.vector,
        payload: doc.payload,
      }));

      await this.client.upsert(this.collectionName, {
        points,
      });

      this.logger.log(`Added ${documents.length} documents to Qdrant`);
      return { success: true };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Failed to add documents to Qdrant: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  async search(vector: number[], limit = 5): Promise<SearchResult[]> {
    try {
      const result = await this.client.search(this.collectionName, {
        vector,
        limit,
      });
      
      // Chuyển đổi kết quả và xác nhận kiểu dữ liệu
      const searchResults: SearchResult[] = result.map((item) => ({
        id: item.id,
        score: item.score,
        payload: item.payload || {},
        version: item.version,
      }));
      
      return searchResults;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Failed to search in Qdrant: ${errorMessage}`);
      throw error;
    }
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return (error as { message: string }).message;
    }
    return String(error);
  }
}
