import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { IUser } from '../../common/interfaces/user.interface';
import { ConfigService } from '@/config/config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getJwtAccessSecret(),
    });
  }

  validate(payload: IUser) {
    // Check if payload has required fields
    if (!payload.user_id || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const { user_id, fullname, email, role } = payload;
    return {
      user_id,
      fullname,
      email,
      role,
    };
  }
}
