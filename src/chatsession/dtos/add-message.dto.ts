import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { MessageSender } from '../../entity/chat-message.entity';

export class AddMessageDto {
  @ApiProperty({
    description: 'Loại người gửi message',
    enum: MessageSender,
    example: MessageSender.USER,
    required: true,
  })
  @IsEnum(MessageSender, { message: 'Sender phải là user, bot hoặc staff' })
  @IsNotEmpty({ message: 'Sender không được để trống' })
  sender: MessageSender;

  @ApiProperty({
    description: 'Nội dung message',
    example: 'Học phí ngành Kỹ thuật phần mềm là bao nhiêu?',
    maxLength: 2000,
    required: true,
  })
  @IsString({ message: 'Content phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Content không được để trống' })
  content: string;

  @ApiProperty({
    description: 'Ý định của message (tùy chọn)',
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
