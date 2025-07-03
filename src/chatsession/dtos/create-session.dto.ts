import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateSessionDto {
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
    description:
      'Tag phân loại session (tiềm năng, không tiềm năng, giỡn, ...)',
    example: 'potential',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tag phải là chuỗi ký tự' })
  tag?: string;
}
