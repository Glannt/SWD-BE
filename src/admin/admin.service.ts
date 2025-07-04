import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly notificationService: NotificationService) {}

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
}
