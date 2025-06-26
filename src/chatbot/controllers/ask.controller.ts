import { Body, Controller, Post, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AskService } from '../services/ask.service';
import { AskQuestionDto } from '../dto/ask-question.dto';
import { AskResponseDto } from '../dto/ask-response.dto';
import { Logger } from '@nestjs/common';

@Controller('chatbot')
@ApiTags('chatbot')
export class AskController {
  private readonly logger = new Logger(AskController.name);

  constructor(private readonly askService: AskService) {}

  /**
   * Test endpoint để kiểm tra session management
   */
  @Get('test-session')
  @ApiOperation({
    summary: 'Test Session Management',
    description: 'Simple test endpoint to verify session management is working',
  })
  async testSession() {
    return {
      message: 'Session management is working!',
      timestamp: new Date().toISOString(),
      endpoints: {
        ask: 'POST /chatbot/ask',
        askLegacy: 'POST /chatbot/ask-legacy',
        createSession: 'POST /chatsession/create',
        getSession: 'GET /chatsession/{sessionId}',
        getMessages: 'GET /chatsession/{sessionId}/messages',
      },
    };
  }

  /**
   * Main AI chatbot endpoint using Pinecone + Gemini AI with session management
   * @param askQuestionDto DTO chứa câu hỏi và thông tin session
   * @returns DTO chứa câu trả lời từ AI và thông tin session
   */
  @Post('ask')
  @ApiOperation({
    summary: 'Ask AI Chatbot (Pinecone + Gemini) with Session Management',
    description:
      'Send questions to the AI chatbot powered by Pinecone vector database and Gemini AI for FPT University career counseling. Automatically manages chat sessions.',
  })
  @ApiBody({ type: AskQuestionDto })
  @ApiResponse({
    status: 200,
    description:
      'AI-generated answer based on FPT University knowledge base with session info',
    schema: {
      type: 'object',
      properties: {
        answer: { type: 'string', description: 'AI-generated answer' },
        sessionId: {
          type: 'string',
          description: 'Chat session ID (smart field)',
        },
        messageId: { type: 'string', description: 'Message ID (smart field)' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid question format',
  })
  @ApiResponse({ status: 404, description: 'Not found - no answer generated' })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - AI service unavailable',
  })
  async ask(@Body() askQuestionDto: AskQuestionDto): Promise<{
    answer: string;
    sessionId: string;
    messageId: string;
  }> {
    const { question, sessionId } = askQuestionDto;
    this.logger.log(
      `[${sessionId || 'new-session'}] Received question: "${question}"`,
    );

    const result =
      await this.askService.processQuestionWithSession(askQuestionDto);

    this.logger.log(
      `[${result.sessionId}] Generated answer with message ID: ${result.messageId}`,
    );
    return result;
  }

  /**
   * Legacy endpoint for backward compatibility
   * @param askQuestionDto DTO chứa câu hỏi
   * @returns DTO chứa câu trả lời từ AI
   */
  @Post('ask-legacy')
  @ApiOperation({
    summary: 'Legacy Ask AI Chatbot (without session management)',
    description:
      'Legacy endpoint for backward compatibility - does not manage sessions',
  })
  @ApiBody({ type: AskQuestionDto })
  @ApiResponse({
    status: 200,
    description: 'AI-generated answer based on FPT University knowledge base',
    type: AskResponseDto,
  })
  async askLegacy(
    @Body() askQuestionDto: AskQuestionDto,
  ): Promise<AskResponseDto> {
    const { question } = askQuestionDto;
    this.logger.log(`[legacy] Received question: "${question}"`);
    const answer = await this.askService.processQuestion(askQuestionDto);
    return { answer };
  }
}
