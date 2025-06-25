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
    example: 'session_123',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
} 