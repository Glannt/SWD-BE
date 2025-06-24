import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSeedService } from './common/services/data-seed.service';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly dataSeedService: DataSeedService) {}

  async onModuleInit() {
    try {
      this.logger.log('🚀 Application starting - checking database...');
      await this.dataSeedService.checkAndSeedData();
    } catch (error) {
      this.logger.error('❌ Failed to initialize database:', error);
      // Don't stop the app, just log the error
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
