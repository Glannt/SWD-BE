import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskQuestionDto {
  @ApiProperty({
    description: 'Câu hỏi gửi đến chatbot',
    example: 'Học phí ngành Kỹ thuật phần mềm là bao nhiêu?',
    minLength: 1,
    maxLength: 500,
  })
  @IsString({ message: 'Câu hỏi phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Câu hỏi không được để trống' })
  @MinLength(1, { message: 'Câu hỏi phải có ít nhất 1 ký tự' })
  @MaxLength(500, { message: 'Câu hỏi không được quá 500 ký tự' })
  question: string;

  @ApiProperty({
    description: 'ID của phiên chat để theo dõi lịch sử',
    example: 'uuid-session-id',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Session ID phải là chuỗi ký tự' })
  sessionId?: string;

  @ApiProperty({
    description: 'ID của user (nếu đã đăng nhập)',
    example: 'user123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'User ID phải là chuỗi ký tự' })
  userId?: string;

  @ApiProperty({
    description: 'ID ẩn danh cho user chưa đăng nhập',
    example: 'anon_abc123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Anonymous ID phải là chuỗi ký tự' })
  anonymousId?: string;
}
