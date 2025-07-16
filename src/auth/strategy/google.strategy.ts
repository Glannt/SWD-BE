import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

import { UserService } from '@/user/user.service';
import { AuthService } from '../auth.service';
import { ConfigService } from '@/config/config.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.getGoogleClientId();
    const clientSecret = configService.getGoogleClientSecret();
    const callbackURL = configService.getGoogleCallBackUrl();

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // const { name, emails, photos } = profile;
    try {
      const user = await this.userService.findOrCreateByGoogle(profile);
      if (!user) {
        console.error('No user found/created from Google profile');
        return done(null, false);
      }
      const checkUser = await this.userService.findById(user.user_id);
      if (!checkUser) {
        console.error('No user found by user_id:', user.user_id);
        return done(null, false);
      }
      const tokens = await this.authService.generateTokens(checkUser);
      done(null, { user, ...tokens });
    } catch (err) {
      console.error('Error in GoogleStrategy.validate:', err);
      done(err, false);
    }
  }
}
