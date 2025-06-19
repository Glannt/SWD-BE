import {
  Controller,
  Post,
  Body,
  Get,
  UseInterceptors,
  UploadedFile,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ChatService } from './chat.service';
import * as path from 'path';
import { Express } from 'express';

// DTO cho chat request
class ChatRequestDto {
  question: string;
}

@Controller('api/chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_QUESTION_LENGTH = 1000;

  constructor(private chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatRequestDto) {
    try {
      if (!body || !body.question) {
        throw new BadRequestException('Câu hỏi không được để trống');
      }

      if (typeof body.question !== 'string') {
        throw new BadRequestException('Câu hỏi phải là chuỗi');
      }

      if (
        body.question.length < 3 ||
        body.question.length > this.MAX_QUESTION_LENGTH
      ) {
        throw new BadRequestException(
          `Câu hỏi phải từ 3 đến ${this.MAX_QUESTION_LENGTH} ký tự`,
        );
      }

      const { question } = body;
      return this.chatService.processChat(question);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in chat endpoint: ${errorMessage}`);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Đã xảy ra lỗi khi xử lý yêu cầu chat',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // Sử dụng giá trị cụ thể thay vì this.MAX_FILE_SIZE
      },
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(doc|docx)' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Không có file nào được tải lên');
      }

      const result = await this.chatService.ingestDocument(file.path);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in upload endpoint: ${errorMessage}`);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: `Lỗi khi tải lên tài liệu: ${errorMessage}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


}
