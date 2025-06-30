import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import { ConfigService } from '@nestjs/config';
import { ChatsessionService } from '@/chatsession/chatsession.service';

@Injectable()
export class PineconeAssistantService implements OnModuleInit {
  private readonly logger = new Logger(PineconeAssistantService.name);
  private pinecone: Pinecone;
  private assistantName = 'fpt-university-advisor';

  constructor(
    private configService: ConfigService,
    private readonly chatSessionService: ChatsessionService,
  ) {
    this.pinecone = new Pinecone({
      apiKey: this.configService.get<string>('PINECONE_API_KEY'),
    });
  }

  async onModuleInit() {
    try {
      await this.initializeAssistant();
    } catch (error) {
      this.logger.error('Failed to initialize Pinecone Assistant:', error);
    }
  }

  /**
   * Initialize or get existing assistant
   */
  private async initializeAssistant() {
    try {
      // Check if assistant already exists
      const assistants = await this.pinecone.listAssistants();
      const existingAssistant = assistants.assistants?.find(
        (a) => a.name === this.assistantName,
      );

      if (!existingAssistant) {
        this.logger.log('Creating new Pinecone Assistant...');
        await this.pinecone.createAssistant({
          name: this.assistantName,
          instructions: `Bạn là FPT AI Assistant - trợ lý tư vấn hướng nghiệp thông minh của Đại học FPT.

          Nhiệm vụ của bạn:
          - Hỗ trợ học sinh cấp 3 trong việc hiểu rõ về các ngành đào tạo tại FPT University
          - Tư vấn chọn ngành học phù hợp với sở thích và năng lực
          - Cung cấp thông tin về học phí, điều kiện tuyển sinh, cơ hội nghề nghiệp
          - Trả lời bằng tiếng Việt, văn phong thân thiện và rõ ràng

          Luôn dựa vào thông tin được cung cấp trong tài liệu. Nếu không có thông tin, hãy trả lời trung thực rằng bạn không biết và gợi ý liên hệ trực tiếp với nhà trường.`,
          region: 'us',
        });
        this.logger.log('✅ Pinecone Assistant created successfully');
      } else {
        this.logger.log('✅ Using existing Pinecone Assistant');
      }
    } catch (error) {
      this.logger.error('❌ Failed to initialize assistant:', error);
      throw error;
    }
  }

  /**
   * Upload document to assistant
   */
  async uploadDocument(filePath: string, metadata?: Record<string, any>) {
    try {
      this.logger.log(`📤 Uploading document: ${filePath}`);

      const assistant = this.pinecone.Assistant(this.assistantName);
      const response = await assistant.uploadFile({
        path: filePath,
        metadata,
      });

      this.logger.log(`✅ Document uploaded successfully: ${response.id}`);
      return response;
    } catch (error) {
      this.logger.error('❌ Failed to upload document:', error);
      throw error;
    }
  }

  /**
   * Chat with assistant with session management
   */
  async chat(
    question: string,
    sessionId?: string,
    userId?: string,
    anonymousId?: string,
  ) {
    try {
      this.logger.log(`🤖 Processing question: ${question}`);
      this.logger.log(
        `📝 Session ID: ${sessionId || 'new-session'}, User ID: ${userId || 'anonymous'}`,
      );

      // Get or create session
      // const session = await this.chatSessionService.getOrCreateSession(
      //   sessionId,
      //   userId,
      //   anonymousId,
      // );

      // this.logger.log(`📋 Using session: ${session.chat_session_id}`);

      // Get AI response from Pinecone Assistant
      const assistant = this.pinecone.Assistant(this.assistantName);
      const chatResponse = await assistant.chat({
        messages: [{ role: 'user', content: question }],
        model: 'gpt-4o',
      });

      this.logger.log('✅ Answer generated successfully');
      const answer =
        chatResponse.message?.content ||
        'Xin lỗi, tôi không thể trả lời câu hỏi này.';

      // Save both question and answer to session using handleChat
      const result = await this.chatSessionService.handleChat(
        question,
        answer,
        sessionId,
        userId,
        anonymousId,
      );

      this.logger.log(`💾 Messages saved to session: ${result.sessionId}`);

      return {
        answer: answer,
        sessionId: result.sessionId,
        messageId: result.messageId,
        citations: chatResponse.citations || [],
        usage: chatResponse.usage,
      };
    } catch (error) {
      this.logger.error('❌ Failed to chat with assistant:', error);
      throw error;
    }
  }

  /**
   * List uploaded files
   */
  async listFiles() {
    try {
      const assistant = this.pinecone.Assistant(this.assistantName);
      const files = await assistant.listFiles();
      return files;
    } catch (error) {
      this.logger.error('❌ Failed to list files:', error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string) {
    try {
      const assistant = this.pinecone.Assistant(this.assistantName);
      await assistant.deleteFile(fileId);
      this.logger.log(`✅ File deleted: ${fileId}`);
    } catch (error) {
      this.logger.error('❌ Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Get assistant status and health
   */
  async getAssistantStatus() {
    try {
      const assistants = await this.pinecone.listAssistants();
      const assistant = assistants.assistants?.find(
        (a) => a.name === this.assistantName,
      );

      if (!assistant) {
        return { status: 'not_found', healthy: false };
      }

      const assistantInstance = this.pinecone.Assistant(this.assistantName);
      const files = await assistantInstance.listFiles();

      return {
        status: assistant.status || 'unknown',
        healthy: true,
        fileCount: files.files?.length || 0,
        createdAt: (assistant as any).createdOn || assistant.createdAt,
        updatedAt: (assistant as any).updatedOn || assistant.updatedAt,
      };
    } catch (error) {
      this.logger.error('❌ Failed to get assistant status:', error);
      return { status: 'error', healthy: false, error: error.message };
    }
  }

  /**
   * Auto-upload FPT University documents if not already uploaded
   * @returns Promise<boolean> - true if documents are available (uploaded or already existed)
   */
  async autoUploadFPTDocuments(): Promise<boolean> {
    try {
      // Check if documents already exist
      const status = await this.getAssistantStatus();

      if (status.fileCount > 0) {
        this.logger.log('📄 Documents already exist in Pinecone Assistant');
        return true;
      }

      this.logger.log('📤 Auto-uploading FPT University documents...');

      // Import upload function dynamically to avoid circular dependency
      const { uploadFPTDocuments } = await import('./cli/upload-fpt-docs');

      // Execute upload with service instance (this will handle its own logging)
      await uploadFPTDocuments(this);

      this.logger.log('✅ Auto-upload completed successfully');
      return true;
    } catch (error) {
      this.logger.error('❌ Auto-upload failed:', error.message);
      this.logger.warn('⚠️ Application will continue without documents');
      return false;
    }
  }
}
