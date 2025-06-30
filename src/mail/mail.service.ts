import { MailerService } from '@nestjs-modules/mailer';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { buildApiUrl, buildVerificationUrl } from '../common/utils/url-builder';
import { Request } from 'express';

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async sendVerificationEmail(email: string, token: string, req?: Request) {
    // Sử dụng utility function để lấy host động
    const url = buildVerificationUrl(req, this.configService, email, token);
    console.log('Verification URL:', url);

    await this.cacheManager.set(`verification:${email}`, token, 86400);

    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Our App! Verify Your Email',
      template: './confirmation',
      context: {
        name: email,
        url,
      },
    });
  }

  async sendResetPasswordEmail(email: string, token: string, req?: Request) {
    // Build reset password URL
    const baseUrl = req
      ? `${req.protocol}://${req.get('host')}`
      : this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    console.log('Reset Password URL:', resetUrl);

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Your Password - FCHAT CAREER',
      template: './reset-password',
      context: {
        email,
        resetUrl,
        token,
      },
    });
  }
}
