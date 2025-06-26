import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class ChatDto {
  @ApiProperty({
    description: 'Câu hỏi của người dùng',
    example: 'Học phí ngành Kỹ thuật phần mềm tại FPT University là bao nhiêu?',
    maxLength: 1000,
    required: true,
  })
  @IsString({ message: 'Question phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Question không được để trống' })
  question: string;

  @ApiProperty({
    description: 'ID của session hiện tại (tùy chọn)',
    example: 'chat_session_001',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Session ID phải là chuỗi ký tự' })
  sessionId?: string;

  @ApiProperty({
    description: 'ID của người dùng đã đăng nhập (tùy chọn)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'User ID phải là chuỗi ký tự' })
  userId?: string;

  @ApiProperty({
    description: 'ID ẩn danh cho người dùng chưa đăng nhập (tùy chọn)',
    example: 'anon_user_123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Anonymous ID phải là chuỗi ký tự' })
  anonymousId?: string;

  @ApiProperty({
    description: 'Ý định của câu hỏi (tùy chọn)',
    example: 'tuition_inquiry',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Intent phải là chuỗi ký tự' })
  intent?: string;

  @ApiProperty({
    description: 'Độ tin cậy của intent (0-1, tùy chọn)',
    example: 0.95,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Confidence phải là số' })
  @Min(0, { message: 'Confidence phải >= 0' })
  @Max(1, { message: 'Confidence phải <= 1' })
  confidence?: number;
}
