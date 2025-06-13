import { MailerService } from '@nestjs-modules/mailer';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { buildApiUrl } from 'src/common/utils/url-builder';

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}
  async sendVerificationEmail(email: string, token: string) {
    const port = this.configService.get<string>('PORT');
    const host = this.configService.get<string>('HOST');
    const version_type = VersioningType.URI;
    console.log(version_type);

    const verifyUrl = buildApiUrl(
      `${host}:${port}`,
      '1',
      '/auth/verify-email',
      {
        email: email,
        token: token,
      },
    );
    console.log('baseurl builder', verifyUrl);

    const url = `http://localhost:${port}/api/v1/auth/verify-email?email=${encodeURIComponent(email)}&token=${token}`;

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
}
