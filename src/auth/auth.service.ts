import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Cache } from 'cache-manager';
// import { Schema, Types } from 'mongoose';
import { MESSAGES } from 'src/common/constants/messages.constants';
import { IUser } from 'src/common/interfaces/user.interface';
import { User, UserDocument } from 'src/entity/user.entity';
import { MailService } from 'src/mail/mail.service';
// import { UserInterface } from 'src/types/user.interface';
import { RegisterDto } from 'src/user/dtos/create-user.dto';
import { UserService } from 'src/user/user.service';
import * as uuid from 'uuid';
@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userService.findOneByEmail(email);

    if (user) {
      const passwordCompare = await this.userService.comparePasswords(
        pass,
        user.password,
      );
      if (passwordCompare) {
        const { ...result } = user;
        return result;
      }
    }

    return null;
  }

  async login(request: Request, response: Response) {
    const user = request.user as UserDocument;
    console.log(user);

    const { user_id, fullName, email, role } = user;

    const payload = {
      sub: 'token login',
      iss: 'from server',
      user_id,
      fullName,
      email,
      role: role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.createRefreshToken(payload);

    await this.userService.updateUserToken(refreshToken, user_id);
    const getTime = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRE'),
      10,
    );

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: getTime,
    });

    return {
      accessToken,
      user: {
        user_id: user_id,
        fullName,
        email,
        role,
      },
    };
  }

  createRefreshToken(payload: any) {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: '1d',
    });
    return refreshToken;
  }

  async logout(user: IUser, response: Response) {
    await this.userService.updateUserToken('', user.user_id);
    response.clearCookie('refresh_token');
    return 'LOGOUT SUCCESSFULLY';
  }

  async register(user: RegisterDto) {
    const existingUser = await this.userService.findOneByEmail(user.email);
    if (existingUser) {
      throw new BadRequestException(MESSAGES.AUTH.EMAIL_EXIST);
    }
    const userCreated = await this.userService.createUser(user);
    if (!userCreated) return null;
    const { user_id } = userCreated;
    const verificationToken = uuid.v4();
    await this.mailService.sendVerificationEmail(user.email, verificationToken);
    return {
      user_id: user_id,
    };
  }

  async verifyEmail(email: string, token: string) {
    const key = `verification:${email}`;
    //get token by key
    const storedToken = await this.cacheManager.get(key);

    //check in redis have token
    if (!storedToken) {
      throw new BadRequestException(MESSAGES.AUTH.EXPIRED_VERIFY_TOKEN);
    }
    // Check if token matches
    if (storedToken !== token) {
      throw new BadRequestException(MESSAGES.AUTH.INVALID_VERIFICATION_TOKEN);
    }

    // Find the user
    const userVerify = await this.userService.findOneByEmail(email);
    if (!userVerify) {
      throw new BadRequestException(MESSAGES.AUTH.UNAUTHORIZED);
    }

    // Check if already verified
    if (userVerify.isVerified) {
      throw new BadRequestException(MESSAGES.AUTH.ALREADY_VERIFIED);
    }

    await this.userService.markAsVerified(userVerify.user_id);

    // Clean up the token
    await this.cacheManager.del(key);

    return {
      success: true,
      message: MESSAGES.AUTH.EMAIL_VERIFIED,
    };
  }
}
