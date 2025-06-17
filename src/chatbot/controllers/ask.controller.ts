import { Body, Controller, Post } from '@nestjs/common';
import { AskService } from '../services/ask.service';
import { AskQuestionDto } from '../dto/ask-question.dto';
import { AskResponseDto } from '../dto/ask-response.dto';

@Controller('chatbot')
export class AskController {
  constructor(private readonly askService: AskService) {}

  /**
   * Endpoint xử lý câu hỏi của người dùng
   * @param askQuestionDto DTO chứa câu hỏi
   * @returns DTO chứa câu trả lời
   */
  @Post('ask')
  async ask(@Body() askQuestionDto: AskQuestionDto): Promise<AskResponseDto> {
    console.log('Received question:', askQuestionDto.question);
    const answer = await this.askService.processQuestion(askQuestionDto.question);
    console.log('Generated answer:', answer);
    return { answer };
  }
} 