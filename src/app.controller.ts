import { Controller, Get, Post, Body, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';
import { AskService } from './chatbot/services/ask.service';
import { AskQuestionDto } from './chatbot/dto/ask-question.dto';
import { AskResponseDto } from './chatbot/dto/ask-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

@Controller()
@ApiTags('app')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly askService: AskService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get welcome message' })
  @ApiResponse({ status: 200, description: 'Welcome message returned successfully' })
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Main chatbot endpoint - optimized for production
   * Direct route for frontend compatibility
   */
  @Post('ask')
  @ApiOperation({
    summary: 'AI Chatbot - FPT University Career Counseling',
    description: 'Send questions to get AI-powered answers about FPT University programs, tuition, scholarships, and career guidance'
  })
  @ApiResponse({
    status: 200,
    description: 'AI-generated answer based on FPT University knowledge base',
    type: AskResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid question format' })
  @ApiResponse({ status: 500, description: 'Internal server error - AI service unavailable' })
  @HttpCode(200)
  async ask(@Body() askQuestionDto: AskQuestionDto) {
    try {
      this.logger.log(`Received question: "${askQuestionDto.question}"`);
      const answer = await this.askService.processQuestion(askQuestionDto);
      return { answer };
    } catch (error) {
      this.logger.error(`Error processing question: ${error.message}`, error.stack);

      // Return user-friendly error response
      return {
        answer: `❌ Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau. Chi tiết lỗi: ${error.message}`
      };
    }
  }
}
