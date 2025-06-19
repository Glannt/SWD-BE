import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AskService } from '../services/ask.service';
import { AskQuestionDto } from '../dto/ask-question.dto';
import { AskResponseDto } from '../dto/ask-response.dto';

@Controller('chatbot')
@ApiTags('chatbot')
export class AskController {
  constructor(private readonly askService: AskService) {}

  /**
   * Main AI chatbot endpoint using Pinecone + Gemini AI
   * @param askQuestionDto DTO chứa câu hỏi
   * @returns DTO chứa câu trả lời từ AI
   */
  @Post('ask')
  @ApiOperation({ 
    summary: 'Ask AI Chatbot (Pinecone + Gemini)',
    description: 'Send questions to the AI chatbot powered by Pinecone vector database and Gemini AI for FPT University career counseling'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'AI-generated answer based on FPT University knowledge base',
    type: AskResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid question format' })
  @ApiResponse({ status: 500, description: 'Internal server error - AI service unavailable' })
  async ask(@Body() askQuestionDto: AskQuestionDto): Promise<AskResponseDto> {
    console.log('🤖 Pinecone Chatbot - Received question:', askQuestionDto.question);
    const answer = await this.askService.processQuestion(askQuestionDto.question);
    console.log('🤖 Pinecone Chatbot - Generated answer:', answer);
    return { answer };
  }
} 