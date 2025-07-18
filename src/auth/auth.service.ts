import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { Request, response, Response } from 'express';
import { Cache } from 'cache-manager';
// import { Schema, Types } from 'mongoose';
import { MESSAGES } from '../common/constants/messages.constants';
import { IUser } from '../common/interfaces/user.interface';
import { User, UserDocument } from '../entity/user.entity';
import { MailService } from '../mail/mail.service';
// import { UserInterface } from 'src/types/user.interface';
import { RegisterDto } from '../user/dtos/create-user.dto';
import { UserService } from '../user/user.service';
import * as uuid from 'uuid';
import { ForgotPasswordRequestDto } from './dtos/forgot-password.request.dto';
import { ResetPasswordRequestDto } from './dtos/reset-password.request.dto';
import { VerifyResetTokenRequestDto } from './dtos/verify-reset-token.request.dto';
import { ChangePasswordRequestDto } from './dtos/change-password.request.dto';
import { ConfigService } from '@/config/config.service';

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
    const getTime = parseInt(this.configService.getJwtRefreshExpire(), 10);

    // Set refresh token in httpOnly cookie
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: getTime,
      path: '/',
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
      secret: this.configService.getJwtRefreshSecret(),
      expiresIn: this.configService.getJwtRefreshExpire(),
    });
    return refreshToken;
  }

  async generateTokens(user: User) {
    const payload = {
      sub: 'token login',
      iss: 'from server',
      user_id: user.user_id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.createRefreshToken(payload);

    await this.userService.updateUserToken(refreshToken, user.user_id);
    const getTime = parseInt(this.configService.getJwtRefreshExpire(), 10);

    return { accessToken, refreshToken };
  }

  async logout(user: IUser, response: Response) {
    await this.userService.updateUserToken('', user.user_id);
    response.clearCookie('refresh_token');
    return 'LOGOUT SUCCESSFULLY';
  }

  async register(user: RegisterDto, req?: Request) {
    const existingUser = await this.userService.findOneByEmail(user.email);
    if (existingUser) {
      throw new BadRequestException(MESSAGES.AUTH.EMAIL_EXIST);
    }
    if (user.confirmPassword != user.password) {
      throw new BadRequestException(MESSAGES.AUTH.PASSWORD_CONFIRM_NOT_MATCH);
    }
    const userCreated = await this.userService.createUser(user);
    if (!userCreated) return null;
    const { user_id } = userCreated;

    // Get the created user to generate tokens
    const createdUser = await this.userService.findOneById(user_id);
    if (!createdUser) {
      throw new BadRequestException('Failed to create user');
    }

    // Generate tokens
    const payload = {
      sub: 'token login',
      iss: 'from server',
      user_id: createdUser.user_id,
      fullName: createdUser.fullName,
      email: createdUser.email,
      role: createdUser.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.createRefreshToken(payload);

    // Update refresh token in database
    await this.userService.updateUserToken(refreshToken, user_id);

    // Send verification email
    const verificationToken = uuid.v4();
    await this.mailService.sendVerificationEmail(
      user.email,
      verificationToken,
      req,
    );

    // Set refresh token in httpOnly cookie if response is available
    if (req && req.res) {
      const getTime = parseInt(this.configService.getJwtRefreshExpire(), 10);

      req.res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: getTime,
        path: '/',
      });
    }

    return {
      accessToken,
      user: {
        user_id: createdUser.user_id,
        fullName: createdUser.fullName,
        email: createdUser.email,
        role: createdUser.role,
      },
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

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordRequestDto,
    req?: Request,
  ) {
    const { email } = forgotPasswordDto;

    // Check if user exists
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: 'If the email exists, a reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = uuid.v4();
    const key = `reset_password:${email}`;

    // Store token in cache with expiration (1 hour)
    await this.cacheManager.set(key, resetToken, 3600000); // 1 hour

    // Also store email mapping for reverse lookup
    await this.cacheManager.set(`reset_token:${resetToken}`, email, 3600000); // 1 hour

    // Send reset email
    await this.mailService.sendResetPasswordEmail(email, resetToken, req);

    return {
      success: true,
      message: 'If the email exists, a reset link has been sent.',
    };
  }

  async verifyResetToken(verifyResetTokenDto: VerifyResetTokenRequestDto) {
    const { token } = verifyResetTokenDto;

    // Get email from token mapping
    const email = await this.cacheManager.get(`reset_token:${token}`);

    if (!email) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Verify the token exists for this email
    const storedToken = await this.cacheManager.get(`reset_password:${email}`);
    if (storedToken !== token) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    return {
      success: true,
      message: 'Token is valid',
      email: email as string,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordRequestDto) {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Get email from token mapping
    const email = await this.cacheManager.get(`reset_token:${token}`);

    if (!email) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const userEmail = email as string;

    // Verify the token exists for this email
    const storedToken = await this.cacheManager.get(
      `reset_password:${userEmail}`,
    );
    if (storedToken !== token) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Find user
    const user = await this.userService.findOneByEmail(userEmail);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update password
    await this.userService.updatePassword(user.user_id, newPassword);

    // Clean up the tokens
    await this.cacheManager.del(`reset_password:${userEmail}`);
    await this.cacheManager.del(`reset_token:${token}`);

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }

  async changePassword(
    changePasswordDto: ChangePasswordRequestDto,
    user: IUser,
  ) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Validate new password is different from current
    if (newPassword === currentPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Find user
    const userData = await this.userService.findOneByEmail(user.email);
    if (!userData) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.userService.comparePasswords(
      currentPassword,
      userData.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password
    await this.userService.updatePassword(userData.user_id, newPassword);

    return {
      success: true,
      message: 'Password has been changed successfully',
    };
  }

  async refreshToken(refreshToken: string, response?: Response) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getJwtRefreshSecret(),
      });

      // Find user by user_id from token
      const user = await this.userService.findOneById(payload.user_id);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if refresh token matches the one stored in database
      if (user.refresh_token !== refreshToken) {
        throw new BadRequestException('Invalid refresh token');
      }

      // Create new payload for access token
      const newPayload = {
        sub: 'token login',
        iss: 'from server',
        user_id: payload.user_id,
        fullName: payload.fullName,
        email: payload.email,
        role: payload.role,
      };

      // Generate new access token
      const newAccessToken = this.jwtService.sign(newPayload);

      // Generate new refresh token with same expiration as original
      const newRefreshToken = this.createRefreshToken(newPayload);

      // Update refresh token in database
      await this.userService.updateUserToken(newRefreshToken, payload.user_id);

      // Set new refresh token in httpOnly cookie if response is available
      if (response) {
        const getTime = parseInt(this.configService.getJwtRefreshExpire(), 10);

        response.cookie('refresh_token', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: getTime,
          path: '/',
        });
      }

      return {
        accessToken: newAccessToken,
        user: {
          user_id: payload.user_id,
          fullName: payload.fullName,
          email: payload.email,
          role: payload.role,
        },
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Refresh token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid refresh token');
      }
      throw error;
    }
  }
}
