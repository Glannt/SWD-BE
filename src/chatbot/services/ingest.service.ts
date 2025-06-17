import { Injectable } from '@nestjs/common';
import { PineconeService } from './pinecone.service';
import { GeminiService } from './gemini.service';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

@Injectable()
export class IngestService {
  constructor(
    private readonly pineconeService: PineconeService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Đọc dữ liệu từ file JSON
   * @param filePath Đường dẫn đến file JSON
   * @returns Dữ liệu JSON đã parse
   */
  async readJsonFile(filePath: string): Promise<any> {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Lỗi khi đọc file JSON ${filePath}:`, error);
      throw new Error(`Không thể đọc file JSON: ${error.message}`);
    }
  }

  /**
   * Chuyển đổi dữ liệu JSON thành các đoạn văn bản
   * @param jsonData Dữ liệu JSON
   * @returns Danh sách các đoạn văn bản
   */
  convertJsonToChunks(jsonData: any): { text: string; metadata: any }[] {
    const chunks = [];

    // Xử lý thông tin về campus
    if (jsonData.campuses) {
      jsonData.campuses.forEach((campus) => {
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
          },
        });
      });
    }

    // Xử lý thông tin về ngành học
    if (jsonData.majors) {
      jsonData.majors.forEach((major) => {
        const text = `
          Tên ngành: ${major.Name}
          Mã ngành: ${major.Code}
          Mô tả: ${major.Description}
          Cơ hội nghề nghiệp: ${major.CareerOpportunities}
          Yêu cầu tuyển sinh: ${major.GeneralAdmissionRequirements}
          Tổng số tín chỉ: ${major.TotalCredits}
          Thời gian đào tạo: ${major.ProgramDuration}
          Hình thức đào tạo: ${major.DeliveryMode}
        `.trim();

        chunks.push({
          text,
          metadata: {
            type: 'major',
            code: major.Code,
            name: major.Name,
          },
        });
      });
    }

    // Xử lý thông tin về học phí
    if (jsonData.tuitionFees) {
      jsonData.tuitionFees.forEach((fee) => {
        const text = `
          Ngành: ${fee.MajorID}
          Học kỳ: ${fee.SemesterRange}
          Học phí: ${fee.BaseAmount} ${fee.Currency}
          Ghi chú: ${fee.Notes}
        `.trim();

        chunks.push({
          text,
          metadata: {
            type: 'tuition',
            major: fee.MajorID,
            semester: fee.SemesterRange,
          },
        });
      });
    }

    // Xử lý thông tin về học bổng
    if (jsonData.scholarships) {
      jsonData.scholarships.forEach((scholarship) => {
        const text = `
          Tên học bổng: ${scholarship.Name}
          Mô tả: ${scholarship.Description}
          Giá trị: ${scholarship.Value} ${scholarship.Currency}
          Yêu cầu: ${scholarship.Requirements}
          Quy trình đăng ký: ${scholarship.ApplicationProcess}
          Thông tin hạn chót: ${scholarship.DeadlineInfo}
        `.trim();

        chunks.push({
          text,
          metadata: {
            type: 'scholarship',
            name: scholarship.Name,
          },
        });
      });
    }

    return chunks;
  }

  /**
   * Xử lý dữ liệu từ file JSON và lưu vào Pinecone
   * @param filePath Đường dẫn đến file JSON
   * @returns Số lượng đoạn đã xử lý
   */
  async ingestJsonFile(filePath: string): Promise<number> {
    try {
      console.log(`📂 Bắt đầu xử lý file JSON: ${filePath}`);
      
      // Đọc file JSON
      const jsonData = await this.readJsonFile(filePath);
      
      // Chuyển đổi thành các đoạn văn bản
      const chunks = this.convertJsonToChunks(jsonData);
      
      console.log(`📄 Đã tạo ${chunks.length} đoạn từ dữ liệu JSON`);

      // Tạo embeddings cho từng đoạn
      const vectors = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`🔄 Xử lý đoạn ${i + 1}/${chunks.length}: ${chunk.text.substring(0, 50)}...`);
        
        // Tạo embedding thực từ Gemini
        const embedding = await this.geminiService.createEmbedding(chunk.text);
        
        // Tạo ID duy nhất cho đoạn
        const id = uuidv4();
        
        // Thêm vào danh sách vectors
        vectors.push({
          id,
          values: embedding,
          metadata: {
            ...chunk.metadata,
            text: chunk.text,
          },
        });
        
        console.log(`✅ Đã tạo embedding ${embedding.length}D cho đoạn ${i + 1}`);
      }
      
      // Lưu tất cả vectors vào Pinecone
      try {
        console.log('📤 Đang lưu vectors vào Pinecone...');
        
        // Sử dụng cấu hình .env mới
        const pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY,
        });
        
        // Lấy index name từ .env
        const indexName = process.env.PINECONE_INDEX_NAME || 'fpt-university-768d';
        const index = pinecone.index(indexName);
        
        // Upsert vectors
        await index.upsert(vectors);
        console.log(`✅ Đã lưu ${vectors.length} vectors vào Pinecone index: ${indexName}`);
      } catch (error) {
        console.error('❌ Lỗi khi lưu vào Pinecone:', error);
        throw error;
      }
      
      console.log(`🎉 Hoàn thành xử lý file JSON: ${filePath}`);
      return chunks.length;
    } catch (error) {
      console.error('❌ Lỗi khi xử lý file JSON:', error);
      throw new Error(`Không thể xử lý file JSON: ${error.message}`);
    }
  }
} 