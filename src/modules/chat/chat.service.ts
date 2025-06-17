import { Injectable, Logger } from '@nestjs/common';
import { RAGService, QueryResult, IngestResult } from '../../rag/rag.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private ragService: RAGService) {}

  /**
   * Xử lý yêu cầu chat từ người dùng
   */
  async processChat(question: string): Promise<QueryResult> {
    try {
      this.logger.log(`Processing chat request: ${question}`);
      const result = await this.ragService.query(question);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error processing chat: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Xử lý yêu cầu ingestion tài liệu
   */
  async ingestDocument(filePath: string): Promise<IngestResult> {
    try {
      this.logger.log(`Processing ingestion request for file: ${filePath}`);
      return this.ragService.ingestDocument(filePath);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error ingesting document: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }
}
