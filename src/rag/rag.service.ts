import { Injectable, Logger } from '@nestjs/common';
import { QdrantService } from './qdrant.service';
import { GeminiService } from './gemini.service';
import { DocumentProcessorService } from './document-processor.service';

// Định nghĩa interface cho nguồn trả về cho người dùng
export interface Source {
  text: string;
  metadata: {
    source: string;
    chunk_index: number;
  };
  score: number;
}

// Định nghĩa interface cho kết quả trả về từ API
export interface QueryResult {
  answer: string;
  sources: Source[];
}

// Định nghĩa interface cho kết quả của ingest document
export interface IngestResult {
  success: boolean;
  message: string;
}

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);

  constructor(
    private qdrantService: QdrantService,
    private geminiService: GeminiService,
    private documentProcessorService: DocumentProcessorService,
  ) {}

  /**
   * Ingestion: Xử lý tài liệu và lưu vào vector database
   */
  async ingestDocument(filePath: string): Promise<IngestResult> {
    try {
      return this.documentProcessorService.processDocument(filePath);
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Error ingesting document: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Query: Tìm kiếm thông tin liên quan và sinh câu trả lời
   */
  async query(question: string): Promise<QueryResult> {
    try {
      // Tạo embedding cho câu hỏi
      const questionEmbedding =
        await this.geminiService.createEmbedding(question);

      // Tìm các đoạn văn bản liên quan nhất
      const searchResults = await this.qdrantService.search(
        questionEmbedding,
        3,
      );

      if (!searchResults.length) {
        return {
          answer:
            'Tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn trong tài liệu.',
          sources: [],
        };
      }

      // Trích xuất text từ kết quả tìm kiếm
      const relevantTexts = searchResults
        .map((result) => {
          if (result.payload && typeof result.payload.text === 'string') {
            return result.payload.text;
          }
          return '';
        })
        .filter((text) => text !== '');

      if (relevantTexts.length === 0) {
        return {
          answer:
            'Tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn trong tài liệu.',
          sources: [],
        };
      }

      // Kết hợp các đoạn văn bản thành một ngữ cảnh
      const context = relevantTexts.join('\n\n');

      // Sinh câu trả lời
      const answer = await this.geminiService.generateResponse(
        question,
        context,
      );

      // Chuẩn bị thông tin nguồn tài liệu
      const sources = searchResults
        .filter(
          (result) => result.payload && typeof result.payload.text === 'string',
        )
        .map((result) => {
          // Xử lý an toàn cho payload
          let extractedText = '';
          let sourceName = 'unknown';
          let chunkIndex = 0;
          
          // Kiểm tra và trích xuất text một cách an toàn
          if (typeof result.payload.text === 'string') {
            extractedText = result.payload.text;
          }
          
          // Kiểm tra và trích xuất metadata một cách an toàn
          if (result.payload.metadata && typeof result.payload.metadata === 'object') {
            if (typeof result.payload.metadata.source === 'string') {
              sourceName = result.payload.metadata.source;
            }
            
            if (typeof result.payload.metadata.chunk_index === 'number') {
              chunkIndex = result.payload.metadata.chunk_index;
            }
          }
          
          return {
            text: extractedText.substring(0, 150) + '...',
            metadata: {
              source: sourceName,
              chunk_index: chunkIndex,
            },
            score: result.score,
          };
        });

      return { answer, sources };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Error querying RAG: ${errorMessage}`);
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
