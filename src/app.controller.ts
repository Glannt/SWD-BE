import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { AskService } from './chatbot/services/ask.service';
import { AskQuestionDto } from './chatbot/dto/ask-question.dto';
import { AskResponseDto } from './chatbot/dto/ask-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
@ApiTags('app')
export class AppController {
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
  async ask(@Body() askQuestionDto: AskQuestionDto): Promise<AskResponseDto> {
    try {
      console.log('🤖 Main chatbot endpoint - Question received:', askQuestionDto.question);
      
      // Validate input
      if (!askQuestionDto || !askQuestionDto.question) {
        throw new Error('Question is required');
      }
      
      if (typeof askQuestionDto.question !== 'string') {
        throw new Error('Question must be a string');
      }
      
      if (askQuestionDto.question.trim().length === 0) {
        throw new Error('Question cannot be empty');
      }
      
      const answer = await this.askService.processQuestion(askQuestionDto.question.trim());
      console.log('✅ Answer generated successfully');
      
      return { answer };
    } catch (error) {
      console.error('❌ Error in main chatbot endpoint:', error.message);
      
      // Return user-friendly error response
      return { 
        answer: `❌ Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau. Chi tiết lỗi: ${error.message}` 
      };
    }
  }


}
