import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { AskService } from './chatbot/services/ask.service';
import { AskQuestionDto } from './chatbot/dto/ask-question.dto';
import { AskResponseDto } from './chatbot/dto/ask-response.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly askService: AskService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Compatibility route for frontend
   * Redirect /ask to chatbot service to maintain backwards compatibility
   */
  @Post('ask')
  async askCompatibility(@Body() askQuestionDto: AskQuestionDto): Promise<AskResponseDto> {
    console.log('📞 Compatibility route /ask called:', askQuestionDto.question);
    const answer = await this.askService.processQuestion(askQuestionDto.question);
    return { answer };
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'FPT University Chatbot (NestJS)',
      version: '1.0.0',
      endpoints: {
        chat: '/ask (compatibility)',
        chatbot: '/api/chatbot/ask (main)',
        docs: '/api/docs'
      }
    };
  }
}
