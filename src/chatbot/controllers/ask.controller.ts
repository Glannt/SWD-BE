import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AskService } from '../services/ask.service';
import { AskQuestionDto } from '../dto/ask-question.dto';
import { AskResponseDto } from '../dto/ask-response.dto';

@Controller('chatbot')
export class AskController {
  constructor(private readonly askService: AskService) {}

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  async askQuestion(@Body() askQuestionDto: AskQuestionDto): Promise<AskResponseDto> {
    try {
      const { question } = askQuestionDto;
      
      if (!question || question.trim().length === 0) {
        throw new Error('Câu hỏi không được để trống');
      }

      console.log('❓ Received question:', question);
      
      const answer = await this.askService.processQuestion(question);
      
      return {
        question,
        answer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error in ask controller:', error);
      
      return {
        question: askQuestionDto.question || '',
        answer: 'Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
} 