import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ChatsessionService } from './chatsession.service';
import { MessageSender } from '../entity/chat-message.entity';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../common/decorators/user.decorator';
import { IsString } from 'class-validator';
import { CreateSessionDto } from './dtos/create-session.dto';
import { AddMessageDto } from './dtos/add-message.dto';
import { ChatDto } from './dtos/chat.dto';

@Controller('chatsession')
@ApiTags('Chat Session Management')
export class ChatsessionController {
  constructor(private readonly chatsessionService: ChatsessionService) {}

  @Post('create')
  @Public()
  @ApiOperation({
    summary: 'Tạo session chat mới',
    description: 'Tạo một session chat mới cho user hoặc anonymous user',
  })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({
    status: 201,
    description: 'Session được tạo thành công',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', example: 'chat_session_001' },
        status: { type: 'string', example: 'active' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createSession(@Body() createSessionDto: CreateSessionDto) {
    const session = await this.chatsessionService.createSession(
      createSessionDto.userId,
      createSessionDto.anonymousId,
    );
    return {
      sessionId: session.chat_session_id,
      status: session.status,
      // startedAt: session.startedAt,
    };
  }

  @Get(':sessionId')
  @Public()
  @ApiOperation({
    summary: 'Lấy thông tin session',
    description: 'Lấy thông tin chi tiết của một session chat',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'ID của session (smart field)',
    example: 'chat_session_001',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin session',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', example: 'chat_session_001' },
        status: { type: 'string', example: 'active' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(@Param('sessionId') sessionId: string) {
    const session = await this.chatsessionService.getSession(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }
    return {
      sessionId: session.chat_session_id,
      status: session.status,
      // startedAt: session.startedAt,
      // lastActivity: session.lastActivity,
    };
  }

  @Get(':sessionId/messages')
  @Public()
  @ApiOperation({
    summary: 'Lấy tất cả messages của session',
    description: 'Lấy danh sách tất cả messages trong một session chat',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'ID của session (smart field)',
    example: 'chat_session_001',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách messages',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439012' },
          chat_message_id: { type: 'string', example: 'chat_message_001' },
          sender: {
            type: 'string',
            enum: ['user', 'bot', 'staff'],
            example: 'user',
          },
          content: {
            type: 'string',
            example: 'Học phí ngành Kỹ thuật phần mềm là bao nhiêu?',
          },
          intent: { type: 'string', example: 'tuition_inquiry' },
          confidence: { type: 'number', example: 0.95 },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSessionMessages(@Param('sessionId') sessionId: string) {
    const messages =
      await this.chatsessionService.getSessionMessages(sessionId);
    return messages.map((msg) => ({
      id: msg._id,
      chat_message_id: msg.chat_message_id,
      sender: msg.sender,
      content: msg.content,
      intent: msg.intent,
      confidence: msg.confidence,
      // createdAt: msg.createdAt,
    }));
  }

  @Post(':sessionId/messages')
  @Public()
  @ApiOperation({
    summary: 'Thêm message vào session',
    description: 'Thêm một message mới vào session chat',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'ID của session (smart field)',
    example: 'chat_session_001',
  })
  @ApiBody({ type: AddMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Message được thêm thành công',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439012' },
        chat_message_id: { type: 'string', example: 'chat_message_001' },
        sender: {
          type: 'string',
          enum: ['user', 'bot', 'staff'],
          example: 'user',
        },
        content: {
          type: 'string',
          example: 'Học phí ngành Kỹ thuật phần mềm là bao nhiêu?',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async addMessage(
    @Param('sessionId') sessionId: string,
    @Body() addMessageDto: AddMessageDto,
  ) {
    const message = await this.chatsessionService.addMessage(
      sessionId,
      addMessageDto.sender,
      addMessageDto.content,
      addMessageDto.intent,
      addMessageDto.confidence,
    );
    return {
      id: message._id,
      chat_message_id: message.chat_message_id,
      sender: message.sender,
      content: message.content,
      // createdAt: message.createdAt,
    };
  }

  @Post('chat')
  @Public()
  @ApiOperation({
    summary: 'Chat với AI (có session management)',
    description:
      'Gửi câu hỏi và nhận câu trả lời từ AI, tự động quản lý session',
  })
  @ApiBody({ type: ChatDto })
  @ApiResponse({
    status: 200,
    description: 'Câu trả lời từ AI với thông tin session',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', example: 'chat_session_001' },
        messageId: { type: 'string', example: 'chat_message_001' },
        answer: {
          type: 'string',
          example: 'Học phí ngành Kỹ thuật phần mềm tại FPT University...',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid question' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async handleChat(@Body() chatDto: ChatDto) {
    // Giả sử có service xử lý AI để tạo câu trả lời
    // Trong thực tế, bạn sẽ gọi AI service ở đây
    const mockAnswer = `Đây là câu trả lời cho: "${chatDto.question}"`;

    const result = await this.chatsessionService.handleChat(
      chatDto.question,
      mockAnswer,
      chatDto.sessionId,
      chatDto.userId,
      chatDto.anonymousId,
      chatDto.intent,
      chatDto.confidence,
    );

    return {
      sessionId: result.sessionId,
      messageId: result.messageId,
      answer: mockAnswer,
    };
  }

  @Post(':sessionId/close')
  @Public()
  @ApiOperation({
    summary: 'Đóng session',
    description: 'Đóng một session chat (chuyển trạng thái thành closed)',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'ID của session (smart field)',
    example: 'chat_session_001',
  })
  @ApiResponse({
    status: 200,
    description: 'Session được đóng thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Session closed successfully' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async closeSession(@Param('sessionId') sessionId: string) {
    await this.chatsessionService.closeSession(sessionId);
    return { message: 'Session closed successfully' };
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Lấy sessions của user',
    description: 'Lấy danh sách tất cả sessions của một user đã đăng nhập',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID của user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sessions của user',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', example: 'chat_session_001' },
          status: { type: 'string', example: 'active' },
        },
      },
    },
  })
  async getUserSessions(@Param('userId') userId: string) {
    const sessions = await this.chatsessionService.getUserSessions(userId);
    return sessions.map((session) => ({
      sessionId: session.chat_session_id,
      status: session.status,
      // startedAt: session.startedAt,
      // lastActivity: session.lastActivity,
    }));
  }

  @Get('anonymous/:anonymousId')
  @Public()
  @ApiOperation({
    summary: 'Lấy sessions của anonymous user',
    description: 'Lấy danh sách tất cả sessions của một anonymous user',
  })
  @ApiParam({
    name: 'anonymousId',
    description: 'ID ẩn danh của user',
    example: 'anon_user_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sessions của anonymous user',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', example: 'chat_session_001' },
          status: { type: 'string', example: 'active' },
        },
      },
    },
  })
  async getAnonymousSessions(@Param('anonymousId') anonymousId: string) {
    const sessions =
      await this.chatsessionService.getAnonymousSessions(anonymousId);
    return sessions.map((session) => ({
      sessionId: session.chat_session_id,
      status: session.status,
      // startedAt: session.startedAt,
      // lastActivity: session.lastActivity,
    }));
  }
}
