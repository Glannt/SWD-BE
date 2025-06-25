import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSeedService } from './common/services/data-seed.service';
import { PineconeAssistantService } from './pinecone-assistant/pinecone-assistant.service';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly dataSeedService: DataSeedService,
    private readonly pineconeAssistantService: PineconeAssistantService,
  ) {}

  async onModuleInit() {
    // Auto-seed database if needed
    this.logger.log('🌱 Checking database and auto-seeding if needed...');
    try {
      await this.dataSeedService.checkAndSeedData();
      this.logger.log('✅ Database check and seed process completed');
    } catch (error) {
      this.logger.error('❌ Error during database seed check:', error);
      this.logger.warn('⚠️ Application will continue, but some features may not work without data');
    }

    // Initialize Pinecone Assistant and auto-upload documents
    try {
      // Check Pinecone Assistant status
      this.logger.log('\n🤖 Checking Pinecone Assistant Status...');
      const assistantStatus = await this.pineconeAssistantService.getAssistantStatus();

      this.logger.log('🎯 Pinecone Assistant Analysis:');
      this.logger.log(`   🤖 Assistant Status: ${assistantStatus.status}`);
      this.logger.log(`   ❤️ Health: ${assistantStatus.healthy ? 'Healthy' : 'Unhealthy'}`);
      this.logger.log(`   📄 Documents: ${assistantStatus.fileCount} files`);
      this.logger.log(`   ⏰ Created: ${assistantStatus.createdAt ? new Date(assistantStatus.createdAt).toLocaleDateString() : 'Unknown'}`);
      this.logger.log(`   ═══════════════════════════════`);

      if (!assistantStatus.healthy) {
        this.logger.error('\n❌ Critical: Pinecone Assistant is not healthy!');
        this.logger.warn('\n🔧 Resolution Required:');
        this.logger.warn('1. Verify PINECONE_API_KEY is valid and active');
        this.logger.warn('2. Check Pinecone service status');
        this.logger.warn('3. Ensure sufficient quota in your Pinecone account');
        this.logger.warn('4. Verify network connectivity to Pinecone');
        this.logger.warn('\n📞 Visit https://app.pinecone.io for account management.');
        // Don't exit - let the app start but with warnings
      } else {
        // Auto-upload FPT documents if healthy
        this.logger.log('\n📚 Auto-uploading FPT University documents...');
        const uploadSuccess = await this.pineconeAssistantService.autoUploadFPTDocuments();

        if (uploadSuccess) {
          this.logger.log('✅ Documents are ready!');
        } else {
          this.logger.warn('⚠️ Documents upload failed, but application will continue');
        }
      }

      this.logger.log('\n✅ Pinecone Assistant Ready!');
      this.logger.log('═══════════════════════════════════════════');
      this.logger.log('🎯 System Overview:');
      this.logger.log('   📚 Knowledge Source: Pinecone Assistant');
      this.logger.log('   🤖 AI Model: GPT-4o via Pinecone');
      this.logger.log('   📄 Document Processing: Automatic chunking & vectorization');
      this.logger.log('   🔍 Search: Semantic similarity with citations');
      this.logger.log('   ✅ Status: Ready for Production');

      this.logger.log('\n🔥 Enhanced Features:');
      this.logger.log('   🎯 Document-based Q&A with citations');
      this.logger.log('   📚 Automatic document processing');
      this.logger.log('   🧠 GPT-4o powered responses');
      this.logger.log('   🔗 Source attribution for transparency');

      this.logger.log('\n📝 Quick Start:');
      this.logger.log('1. 📤 Upload documents: POST /assistant/upload');
      this.logger.log('2. 💬 Ask questions: POST /assistant/chat');
      this.logger.log('3. 📊 Check status: GET /assistant/status');
      this.logger.log('4. 📋 View files: GET /assistant/files');

      this.logger.log('\n🔗 Useful Commands:');
      this.logger.log('   npm run assistant:upload  # Upload FPT University documents');
      this.logger.log('   npm run start:dev         # Start development server');
      this.logger.log('   npm run assistant:status  # Check assistant status');

    } catch (error) {
      this.logger.error('\n💥 Pinecone Assistant Initialization Failed:', error);

      this.logger.warn('\n🔧 Troubleshooting Guide:');
      this.logger.warn('\n1. 🎯 Pinecone Issues:');
      this.logger.warn('   • Validate API key: check PINECONE_API_KEY in .env');
      this.logger.warn('   • Check account: visit https://app.pinecone.io');
      this.logger.warn('   • Verify quotas: ensure sufficient Pinecone usage limits');

      this.logger.warn('\n2. 🔧 Environment Issues:');
      this.logger.warn('   • Review .env file: ensure PINECONE_API_KEY is set');
      this.logger.warn('   • Check network: verify external API access');
      this.logger.warn('   • Validate dependencies: npm install');

      this.logger.warn('\n3. 📞 Support Resources:');
      this.logger.warn('   • Check Pinecone status: https://status.pinecone.io');
      this.logger.warn('   • Review logs for detailed error messages');
      this.logger.warn('   • Contact Pinecone support if issues persist');

      this.logger.warn('\n⚠️ Application will continue with limited functionality');
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
