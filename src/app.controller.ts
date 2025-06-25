import { Controller, Get, Post, Body, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';
// import { AskService } from './chatbot/services/ask.service'; // Replaced by PineconeAssistantService
import { PineconeAssistantService } from './pinecone-assistant/pinecone-assistant.service';
import { ChatRequestDto } from './pinecone-assistant/dto/chat-request.dto';
import { ChatResponseDto } from './pinecone-assistant/dto/chat-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

@Controller()
@ApiTags('app')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly assistantService: PineconeAssistantService,
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
    type: ChatResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid question format' })
  @ApiResponse({ status: 500, description: 'Internal server error - AI service unavailable' })
  @HttpCode(200)
  async ask(@Body() chatRequestDto: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      this.logger.log(`Received question: "${chatRequestDto.question}"`);
      const response = await this.assistantService.chat(chatRequestDto.question, chatRequestDto.sessionId);
      
      // Transform the response to match our DTO
      return {
        answer: response.answer,
        citations: response.citations?.map((citation: any) => ({
          position: citation.position,
          references: citation.references?.map((ref: any) => ({
            pages: ref.pages,
            file: {
              id: ref.file.id,
              name: ref.file.name,
              metadata: ref.file.metadata,
              createdOn: ref.file.createdOn ? new Date(ref.file.createdOn).toISOString() : undefined,
              updatedOn: ref.file.updatedOn ? new Date(ref.file.updatedOn).toISOString() : undefined,
              status: ref.file.status,
              size: ref.file.size,
            },
          })),
        })),
        usage: response.usage ? {
          prompt_tokens: (response.usage as any).promptTokens || (response.usage as any).prompt_tokens || 0,
          completion_tokens: (response.usage as any).completionTokens || (response.usage as any).completion_tokens || 0,
          total_tokens: (response.usage as any).totalTokens || (response.usage as any).total_tokens || 0,
        } : undefined,
      };
    } catch (error) {
      this.logger.error(`Error processing question: ${error.message}`, error.stack);

      // Return user-friendly error response
      return {
        answer: `❌ Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau. Chi tiết lỗi: ${error.message}`
      };
    }
  }
}
