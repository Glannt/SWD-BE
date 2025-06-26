import { ApiProperty } from '@nestjs/swagger';

export class ChatCitation {
  @ApiProperty({
    description: 'Vị trí trong câu trả lời mà citation tham chiếu',
    example: 63,
    required: false,
  })
  position?: number;

  @ApiProperty({
    description: 'Thông tin tham chiếu từ tài liệu',
    type: 'object',
    additionalProperties: true,
  })
  references: {
    pages?: number[];
    file: {
      id: string;
      name: string;
      metadata?: Record<string, any>;
      createdOn?: string;
      updatedOn?: string;
      status: string;
      size?: number;
    };
  }[];
}

export class ChatUsage {
  @ApiProperty({
    description: 'Token được sử dụng cho prompt',
    example: 9259,
  })
  prompt_tokens: number;

  @ApiProperty({
    description: 'Token được sử dụng cho completion',
    example: 30,
  })
  completion_tokens: number;

  @ApiProperty({
    description: 'Tổng token được sử dụng',
    example: 9289,
  })
  total_tokens: number;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'Câu trả lời từ AI Assistant',
    example:
      'Học phí ngành Kỹ thuật phần mềm tại FPT University là 25.000.000 VNĐ/năm học...',
  })
  answer: string;

  @ApiProperty({
    description: 'ID của session chat (nếu có session management)',
    example: 'chat_session_001',
    required: false,
  })
  sessionId?: string;

  @ApiProperty({
    description: 'ID của message (nếu có session management)',
    example: 'chat_message_001',
    required: false,
  })
  messageId?: string;

  @ApiProperty({
    description: 'Danh sách citations từ tài liệu tham khảo',
    required: false,
  })
  citations?: any[];

  @ApiProperty({
    description: 'Thông tin sử dụng tokens',
    required: false,
  })
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
