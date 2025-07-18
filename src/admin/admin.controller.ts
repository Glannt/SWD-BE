import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '../entity/user.entity';
import { ChatSession } from '../entity/chat-session.entity';
import { ChatMessage } from '../entity/chat-message.entity';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('admin-dashboard')
@Controller('admin/dashboard')
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(ChatSession.name) private sessionModel: Model<ChatSession>,
    @InjectModel(ChatMessage.name) private messageModel: Model<ChatMessage>,
    private readonly adminService: AdminService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Thống kê tổng quan dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Tổng quan: số truy cập, user đã chat, session chat',
  })
  async getSummary() {
    return this.adminService.getDashboardSummary();
  }

  @Get('users')
  @ApiOperation({ summary: 'Danh sách user đã từng chat' })
  @ApiResponse({ status: 200, description: 'Danh sách user đã chat' })
  async getUsersChatted() {
    return this.adminService.getUsersChatted();
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Table user đã chat và các session, tag' })
  @ApiResponse({ status: 200, description: 'Table user, session, tag' })
  async getSessionsTable() {
    return this.adminService.getSessionsTable();
  }

  @Get('sessions-messages')
  @ApiOperation({
    summary: 'Table user, session, tag, messages (cho AI tagging)',
  })
  @ApiResponse({
    status: 200,
    description: 'Table user, session, tag, messages',
  })
  async getSessionsWithMessages() {
    return this.adminService.getSessionsWithMessages();
  }

  @Post('update-session-tag')
  @ApiOperation({ summary: 'Cập nhật tag cho session chat' })
  @ApiResponse({ status: 200, description: 'Cập nhật tag thành công' })
  @ApiResponse({ status: 404, description: 'Session không tồn tại' })
  async updateSessionTag(@Body() body: { sessionId: string; tag: string }) {
    return this.adminService.updateSessionTag(body.sessionId, body.tag);
  }
}
