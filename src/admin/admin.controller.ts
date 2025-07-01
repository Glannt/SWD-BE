import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../entity/user.entity';
import { ChatSession } from '../entity/chat-session.entity';
import { ChatMessage } from '../entity/chat-message.entity';

@ApiTags('admin-dashboard')
@Controller('admin/dashboard')
export class AdminController {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(ChatSession.name) private sessionModel: Model<ChatSession>,
    @InjectModel(ChatMessage.name) private messageModel: Model<ChatMessage>,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Thống kê tổng quan dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Tổng quan: số truy cập, user đã chat, session chat',
  })
  async getSummary() {
    const totalSessions = await this.sessionModel.countDocuments();
    const usersChatted = await this.sessionModel.distinct('user');
    const totalUsersChatted = usersChatted.length;
    return {
      totalVisits: totalSessions,
      totalUsersChatted,
      totalSessions,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Danh sách user đã từng chat' })
  @ApiResponse({ status: 200, description: 'Danh sách user đã chat' })
  async getUsersChatted() {
    const sessions = await this.sessionModel
      .find({ user: { $ne: null } })
      .populate('user');
    const userMap = new Map();
    sessions.forEach((s) => {
      if (s.user && !userMap.has(s.user.user_id)) {
        userMap.set(s.user.user_id, {
          user_id: s.user.user_id,
          email: s.user.email,
          fullName: s.user.fullName,
          totalSessions: 1,
          lastSessionAt: s.get('lastActivity') || s.get('startedAt'),
        });
      } else if (s.user) {
        const u = userMap.get(s.user.user_id);
        u.totalSessions += 1;
        if (s.get('lastActivity') > u.lastSessionAt)
          u.lastSessionAt = s.get('lastActivity');
        userMap.set(s.user.user_id, u);
      }
    });
    return Array.from(userMap.values());
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Table user đã chat và các session, tag' })
  @ApiResponse({ status: 200, description: 'Table user, session, tag' })
  async getSessionsTable() {
    const sessions = await this.sessionModel
      .find({ user: { $ne: null } })
      .populate('user');
    const userMap = new Map();
    sessions.forEach((s) => {
      if (s.user) {
        if (!userMap.has(s.user.user_id)) {
          userMap.set(s.user.user_id, {
            user_id: s.user.user_id,
            email: s.user.email,
            fullName: s.user.fullName,
            sessions: [],
          });
        }
        userMap.get(s.user.user_id).sessions.push({
          sessionId: s.chat_session_id,
          createdAt: s.get('startedAt'),
          tag: s.tag || null,
        });
      }
    });
    return Array.from(userMap.values());
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
    const sessions = await this.sessionModel
      .find({ user: { $ne: null } })
      .populate('user');
    const userMap = new Map();
    for (const s of sessions) {
      if (s.user) {
        if (!userMap.has(s.user.user_id)) {
          userMap.set(s.user.user_id, {
            user_id: s.user.user_id,
            email: s.user.email,
            fullName: s.user.fullName,
            sessions: [],
          });
        }
        // Lấy toàn bộ messages của session này
        const messages = await this.messageModel
          .find({ session: s.chat_session_id })
          .sort({ createdAt: 1 });
        userMap.get(s.user.user_id).sessions.push({
          sessionId: s.chat_session_id,
          createdAt: s.get('startedAt'),
          tag: s.tag || null,
          messages: messages.map((m) => ({
            sender: m.sender,
            content: m.content,
            // createdAt: m.createdAt,
          })),
        });
      }
    }
    return Array.from(userMap.values());
  }

  @Post('update-session-tag')
  @ApiOperation({ summary: 'Cập nhật tag cho session chat' })
  @ApiResponse({ status: 200, description: 'Cập nhật tag thành công' })
  @ApiResponse({ status: 404, description: 'Session không tồn tại' })
  async updateSessionTag(@Body() body: { sessionId: string; tag: string }) {
    const { sessionId, tag } = body;
    const session = await this.sessionModel.findOne({
      chat_session_id: sessionId,
    });
    if (!session) {
      return { success: false, message: 'Session không tồn tại' };
    }
    session.tag = tag;
    await session.save();
    return {
      success: true,
      message: 'Cập nhật tag thành công',
      sessionId,
      tag,
    };
  }
}
