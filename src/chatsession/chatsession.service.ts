import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatSession, ChatSessionStatus } from '../entity/chat-session.entity';
import { ChatMessage, MessageSender } from '../entity/chat-message.entity';
import { User } from '../entity/user.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ChatsessionService {
  private readonly logger = new Logger(ChatsessionService.name);

  constructor(
    @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSession>,
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessage>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Tạo session mới
   */
  async createSession(
    userId?: string,
    anonymousId?: string,
  ): Promise<ChatSession> {
    const sessionData: Partial<ChatSession> = {
      status: ChatSessionStatus.ACTIVE,
    };
    this.logger.log('userid', userId);
    if (userId) {
      const user = await this.userModel.findOne({ user_id: userId });
      this.logger.log('user', user);

      if (user) {
        sessionData.user = user;
        this.logger.log(`Found user: ${user.email}`);
      } else {
        this.logger.warn(`User not found: ${userId}`);
      }
    }

    if (anonymousId) {
      sessionData.anonymousID = anonymousId;
    }

    // Tạo session - smart field ID sẽ được tự động tạo bởi middleware
    const session = await this.chatSessionModel.create(sessionData);

    this.logger.log(
      `Created new chat session with chat_session_id: ${session.chat_session_id}`,
    );
    return session;
  }

  /**
   * Lấy session theo ID
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.chatSessionModel.findOne({ chat_session_id: sessionId }).exec();
  }

  /**
   * Tạo hoặc lấy session hiện có
   */
  async getOrCreateSession(
    sessionId?: string,
    userId?: string,
    anonymousId?: string,
  ): Promise<ChatSession> {
    if (sessionId) {
      const existingSession = await this.getSession(sessionId);
      if (existingSession) {
        return existingSession;
      }
    }

    // Tạo session mới nếu không có sessionId hoặc session không tồn tại
    return this.createSession(userId, anonymousId);
  }

  /**
   * Thêm message vào session
   */
  async addMessage(
    sessionId: string,
    sender: MessageSender,
    content: string,
    intent?: string,
    confidence?: number,
  ): Promise<ChatMessage> {
    const messageData = {
      session: sessionId,
      sender,
      content,
      intent,
      confidence,
    };

    // Tạo message - smart field ID sẽ được tự động tạo
    const message = await this.chatMessageModel.create(messageData);

    // Cập nhật lastActivity của session
    await this.chatSessionModel.updateOne(
      { chat_session_id: sessionId },
      { lastActivity: new Date() },
    );

    this.logger.log(
      `Added ${sender} message to session: ${sessionId} with chat_message_id: ${message.chat_message_id}`,
    );
    return message;
  }

  /**
   * Lấy tất cả messages của một session
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.chatMessageModel
      .find({ session: sessionId })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Đóng session
   */
  async closeSession(sessionId: string): Promise<void> {
    await this.chatSessionModel.updateOne(
      { chat_session_id: sessionId },
      { status: ChatSessionStatus.CLOSED },
    );
    this.logger.log(`Closed session: ${sessionId}`);
  }

  /**
   * Xử lý chat với auto session management
   */
  async handleChat(
    question: string,
    answer: string,
    sessionId?: string,
    userId?: string,
    anonymousId?: string,
    intent?: string,
    confidence?: number,
  ): Promise<{ sessionId: string; messageId: string }> {
    // Lấy hoặc tạo session
    const session = await this.getOrCreateSession(
      sessionId,
      userId,
      anonymousId,
    );

    // Thêm câu hỏi của user
    const userMessage = await this.addMessage(
      session.chat_session_id,
      MessageSender.USER,
      question,
      intent,
      confidence,
    );

    // Thêm câu trả lời của bot
    const botMessage = await this.addMessage(
      session.chat_session_id,
      MessageSender.BOT,
      answer,
    );

    return {
      sessionId: session.chat_session_id,
      messageId: botMessage.chat_message_id,
    };
  }

  /**
   * Lấy sessions của user
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    return this.redisService.getOrSetCache<ChatSession[]>(
      `user:sessions:${userId}`,
      89400, // TTL 10 phút
      async () => {
        const existingUser = await this.userModel.findOne({ user_id: userId });
        if (!existingUser) return [];
        return this.chatSessionModel
          .find({ user: existingUser._id })
          .sort({ lastActivity: -1 })
          .exec();
      },
    );
  }

  /**
   * Lấy sessions của anonymous user
   */
  async getAnonymousSessions(anonymousId: string): Promise<ChatSession[]> {
    return this.chatSessionModel
      .find({ anonymousID: anonymousId })
      .sort({ lastActivity: -1 })
      .exec();
  }
}
