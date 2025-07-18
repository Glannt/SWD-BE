import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import { NotificationService } from '../notification/notification.service';
import { Model } from 'mongoose';
import { ChatSession } from '../entity/chat-session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { ChatMessage } from '@/entity/chat-message.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedisService } from '@/redis/redis.service';
import { ConfigService } from '@/config/config.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    @InjectModel(ChatSession.name)
    private readonly sessionModel: Model<ChatSession>,
    @InjectModel(ChatMessage.name)
    private readonly messageModel: Model<ChatMessage>,
  ) {}
  @Cron('*/30 * * * *') // Mỗi 30 phút
  handleCron() {
    this.logger.log('⏰ Đang chạy AI tagging pipeline (ai_tag_sessions.py)...');
    exec('python ai_tag_sessions.py', (err, stdout, stderr) => {
      if (err) {
        this.logger.error('Cronjob error:', err);
        this.notificationService.sendToAdmin(
          'AI Task Update',
          'AI tagging pipeline failed. Check logs.',
          { error: err.message },
        );
      } else {
        this.logger.log('Cronjob output:', stdout);
        this.notificationService.sendToAdmin(
          'AI Task Update',
          'AI tagging pipeline completed. Admin, please check the new results.',
          { output: stdout },
        );
      }
      if (stderr) {
        this.logger.warn('Cronjob stderr:', stderr);
      }
    });
  }

  async getDashboardSummary() {
    return this.redisService.getOrSetCache(
      'admin:dashboard:summary',
      this.configService.getCacheTtl(),
      async () => {
        const totalSessions = await this.sessionModel.countDocuments();
        const usersChatted = await this.sessionModel.distinct('user');
        const totalUsersChatted = usersChatted.length;
        return {
          totalVisits: totalSessions,
          totalUsersChatted,
          totalSessions,
        };
      },
    );
  }

  async getUsersChatted() {
    return this.redisService.getOrSetCache(
      'admin:dashboard:users',
      this.configService.getCacheTtl(),
      async () => {
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
      },
    );
  }

  async getSessionsTable() {
    return this.redisService.getOrSetCache(
      'admin:dashboard:sessions',
      this.configService.getCacheTtl(),
      async () => {
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
      },
    );
  }

  async getSessionsWithMessages() {
    return this.redisService.getOrSetCache(
      'admin:dashboard:sessions-messages',
      this.configService.getCacheTtl(),
      async () => {
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
      },
    );
  }

  async updateSessionTag(sessionId: string, tag: string): Promise<any> {
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
