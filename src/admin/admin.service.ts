import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  @Cron('*/2 * * * *') // Mỗi 30 phút
  handleCron() {
    this.logger.log('⏰ Đang chạy AI tagging pipeline (ai_tag_sessions.py)...');
    exec('python3 ai_tag_sessions.py', (err, stdout, stderr) => {
      if (err) {
        this.logger.error('Cronjob error:', err);
      } else {
        this.logger.log('Cronjob output:', stdout);
      }
      if (stderr) {
        this.logger.warn('Cronjob stderr:', stderr);
      }
    });
  }
}
