import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { GeminiService } from './gemini.service';
import { IngestResult } from './rag.service';

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);
  private readonly chunkSize = 1000; // Kích thước đoạn văn bản (tùy chỉnh theo nhu cầu)
  private readonly chunkOverlap = 200; // Kích thước overlap giữa các đoạn

  constructor(
    private geminiService: GeminiService,
  ) {}

  /**
   * Xử lý tài liệu Word - hiện tại chỉ extract text và log
   * TODO: Implement alternative storage solution
   */
  async processDocument(filePath: string): Promise<IngestResult> {
    try {
      this.logger.log(`Processing document: ${filePath}`);

      // Đọc và trích xuất nội dung từ file Word
      const textContent = await this.extractTextFromDoc(filePath);

      // Chia nhỏ nội dung thành các đoạn
      const chunks = this.splitIntoChunks(textContent);
      this.logger.log(`Split document into ${chunks.length} chunks`);

      // Log thông tin để debug (có thể implement storage sau)
      this.logger.log(`Document processed successfully: ${path.basename(filePath)}`);
      this.logger.log(`Text length: ${textContent.length} characters`);
      this.logger.log(`Number of chunks: ${chunks.length}`);

      return {
        success: true,
        message: `Successfully processed document and extracted ${chunks.length} chunks (storage not implemented)`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error processing document: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Trích xuất văn bản từ file .doc/.docx
   */
  private async extractTextFromDoc(filePath: string): Promise<string> {
    try {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error extracting text from document: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Chia văn bản thành các đoạn nhỏ với độ chồng lấp
   * Cải tiến để giữ ngữ cảnh tốt hơn bằng cách tôn trọng cấu trúc đoạn văn, câu
   */
  private splitIntoChunks(text: string): string[] {
    // Xử lý text để chuẩn hóa, loại bỏ ký tự đặc biệt, khoảng trắng liên tiếp
    const cleanedText = text.replace(/\s+/g, ' ').trim();

    // Chia văn bản thành các đoạn dựa trên dấu xuống dòng hoặc các dấu ngắt đoạn
    const paragraphs = cleanedText
      .split(/\n{2,}|\r\n{2,}|(?<=\.)\s+(?=[A-Z])/g)
      .filter((p) => p.trim().length > 0);

    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      // Nếu thêm đoạn này vào sẽ vượt quá kích thước chunk
      if (
        currentChunk.length + paragraph.length > this.chunkSize &&
        currentChunk.length > 0
      ) {
        // Lưu chunk hiện tại và bắt đầu chunk mới
        chunks.push(currentChunk.trim());

        // Bắt đầu chunk mới với một phần overlap từ chunk trước
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(
          Math.max(0, words.length - this.chunkOverlap / 10),
        );
        currentChunk = overlapWords.join(' ') + ' ' + paragraph;
      } else {
        // Thêm đoạn vào chunk hiện tại
        currentChunk += (currentChunk ? ' ' : '') + paragraph;
      }
    }

    // Thêm chunk cuối cùng nếu còn
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    // Kiểm tra và xử lý các chunk quá nhỏ
    return this.mergeSmallChunks(chunks);
  }

  /**
   * Gộp các chunk quá nhỏ để tối ưu
   */
  private mergeSmallChunks(chunks: string[]): string[] {
    if (chunks.length <= 1) return chunks;

    const minChunkSize = this.chunkSize / 3; // Ngưỡng để xác định chunk nhỏ
    const result: string[] = [];

    let i = 0;
    // eslint-disable-next-line prettier/prettier
    while (i < chunks.length) {
      let currentChunk = chunks[i];

      // Nếu chunk hiện tại quá nhỏ và không phải chunk cuối
      if (currentChunk.length < minChunkSize && i < chunks.length - 1) {
        // Gộp với chunk tiếp theo nếu tổng kích thước không vượt quá giới hạn
        if (currentChunk.length + chunks[i + 1].length <= this.chunkSize) {
          currentChunk = currentChunk + ' ' + chunks[i + 1];
          i += 2; // Bỏ qua chunk tiếp theo vì đã gộp
        } else {
          i++; // Giữ nguyên chunk nhỏ này nếu không thể gộp
        }
      } else {
        i++; // Chuyển sang chunk tiếp theo
      }

      result.push(currentChunk);
    }

    return result;
  }
}
