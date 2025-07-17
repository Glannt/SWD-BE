import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
  Param,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { PineconeAssistantService } from './pinecone-assistant.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('assistant')
@ApiTags('assistant')
export class PineconeAssistantController {
  private readonly logger = new Logger(PineconeAssistantController.name);

  constructor(private readonly assistantService: PineconeAssistantService) {}

  /**
   * Chat with Pinecone Assistant
   */
  @Post('chat')
  @ApiOperation({
    summary: 'Tư vấn với FPT AI Assistant',
    description:
      'Gửi câu hỏi tới AI Assistant và nhận câu trả lời với citations từ tài liệu tham khảo. Tự động quản lý session chat.',
  })
  @ApiBody({ type: ChatRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Câu trả lời từ AI Assistant với citations và session info',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Câu hỏi không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      this.logger.log(`Chat request: ${chatRequest.question}`);
      this.logger.log(
        `Session ID: ${chatRequest.sessionId || 'new-session'}, User ID: ${chatRequest.user_id || 'anonymous'}`,
      );

      const response = await this.assistantService.chat(
        chatRequest.question,
        chatRequest.sessionId,
        chatRequest.user_id,
        chatRequest.anonymousId,
      );

      // Transform the response to match our DTO
      return {
        answer: response.answer,
        sessionId: response.sessionId,
        // messageId: response.messageId,
        // citations: response.citations?.map((citation: any) => ({
        //   position: citation.position,
        //   references: citation.references?.map((ref: any) => ({
        //     pages: ref.pages,
        //     file: {
        //       id: ref.file.id,
        //       name: ref.file.name,
        //       metadata: ref.file.metadata,
        //       createdOn: ref.file.createdOn
        //         ? new Date(ref.file.createdOn).toISOString()
        //         : undefined,
        //       updatedOn: ref.file.updatedOn
        //         ? new Date(ref.file.updatedOn).toISOString()
        //         : undefined,
        //       status: ref.file.status,
        //       size: ref.file.size,
        //     },
        //   })),
        // })),
        // usage: response.usage
        //   ? {
        //       prompt_tokens:
        //         (response.usage as any).promptTokens ||
        //         (response.usage as any).prompt_tokens ||
        //         0,
        //       completion_tokens:
        //         (response.usage as any).completionTokens ||
        //         (response.usage as any).completion_tokens ||
        //         0,
        //       total_tokens:
        //         (response.usage as any).totalTokens ||
        //         (response.usage as any).total_tokens ||
        //         0,
        //     }
        //   : undefined,
      };
    } catch (error) {
      this.logger.error('Chat error:', error);
      throw new BadRequestException(
        'Không thể xử lý câu hỏi của bạn. Vui lòng thử lại.',
      );
    }
  }

  /**
   * Upload document to assistant
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/markdown',
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Chỉ hỗ trợ file PDF, DOC, DOCX, TXT, MD'),
            false,
          );
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload tài liệu',
    description:
      'Upload tài liệu (PDF, DOC, DOCX, TXT, MD) để AI Assistant có thể sử dụng',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Upload thành công',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        fileId: { type: 'string' },
        fileName: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'File không hợp lệ' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để upload');
    }

    try {
      this.logger.log(`Uploading file: ${file.originalname}`);
      const response = await this.assistantService.uploadDocument(file.path, {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });

      return {
        success: true,
        fileId: response.id,
        fileName: file.originalname,
        message: 'File đã được upload thành công',
      };
    } catch (error) {
      this.logger.error('Upload error:', error);
      throw new BadRequestException('Không thể upload file. Vui lòng thử lại.');
    }
  }

  /**
   * Get assistant status
   */
  @Get('status')
  @ApiOperation({
    summary: 'Kiểm tra trạng thái Assistant',
    description: 'Lấy thông tin trạng thái và sức khỏe của AI Assistant',
  })
  @ApiResponse({
    status: 200,
    description: 'Trạng thái Assistant',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        healthy: { type: 'boolean' },
        fileCount: { type: 'number' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  async getStatus() {
    return this.assistantService.getAssistantStatus();
  }

  /**
   * List uploaded files
   */
  @Get('files')
  @ApiOperation({
    summary: 'Danh sách file đã upload',
    description: 'Lấy danh sách tất cả file đã upload vào Assistant',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách files',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              originalName: { type: 'string' },
              status: { type: 'string' },
              createdOn: { type: 'string' },
              updatedOn: { type: 'string' },
              size: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async listFiles() {
    const result = await this.assistantService.listFiles();
    
    // Biến đổi kết quả để hiển thị tên gốc từ metadata
    if (result.files && result.files.length > 0) {
      result.files = result.files.map(file => {
        // Xác định metadata với tất cả các thuộc tính có thể có
        const metadata = file.metadata as { 
          originalName?: string; 
          uploadedAt?: string;
          mimeType?: string;
          size?: number;
        } || {};
        
        const originalName = metadata.originalName || file.name;
        
        return {
          ...file,
          // Lưu tên gốc trong metadata vào originalName
          originalName: originalName,
          // Thay thế tên hiển thị mặc định bằng tên gốc
          name: originalName,
          // Thêm thông tin metadata khác nếu cần
          uploadedAt: metadata.uploadedAt || file.createdOn,
          fileType: metadata.mimeType || 'unknown',
        };
      });
    }
    
    return result;
  }

  /**
   * Delete uploaded file using DELETE method
   */
  @ApiOperation({
    summary: 'Xóa file đã upload',
    description: 'Xóa một file đã upload vào Assistant theo ID',
  })
  @ApiResponse({
    status: 200,
    description: 'File đã được xóa thành công',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'File không tồn tại hoặc không thể xóa' })
  @Delete('files/:fileId')
  async deleteFileByParam(@Param('fileId') fileId: string) {
    try {
      if (!fileId) {
        throw new BadRequestException('ID file không được cung cấp');
      }
      
      this.logger.log(`Deleting file with ID: ${fileId}`);
      await this.assistantService.deleteFile(fileId);
      
      return {
        success: true,
        message: 'File đã được xóa thành công',
      };
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw new BadRequestException(`Không thể xóa file: ${error.message}`);
    }
  }
}
