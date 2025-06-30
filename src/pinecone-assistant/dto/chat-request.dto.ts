import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({
    description: 'Câu hỏi của người dùng',
    example: 'Học phí ngành Kỹ thuật phần mềm tại FPT University là bao nhiêu?',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Câu hỏi không được để trống' })
  @MaxLength(1000, { message: 'Câu hỏi không được vượt quá 1000 ký tự' })
  question: string;

  @ApiProperty({
    description: 'Session ID (tùy chọn) để track cuộc hội thoại',
    required: false,
    example: 'chat_session_001',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({
    description: 'ID của người dùng đã đăng nhập',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({
    description: 'ID ẩn danh cho người dùng chưa đăng nhập',
    example: 'anon_user_123',
    required: false,
  })
  @IsOptional()
  @IsString()
  anonymousId?: string;
}
