import { ConfigService } from '@/config/config.service';
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private config: ConfigService) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const redirect = req.query.redirect as string;
    const frontendRedirect = redirect
      ? decodeURIComponent(redirect)
      : this.config.get('FE_DOMAIN') || 'http://localhost:5173';

    // Gắn state để gửi lên Google
    const stateObj = { redirect: frontendRedirect };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

    // Truyền state vào options cho passport
    req.query.state = state;

    // Gọi passport với options custom
    return super.canActivate(context);
  }
}
