import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { User } from '../common/decorators/user.decorator';
import { IUser } from '../common/interfaces/user.interface';
import { RegisterDto } from '../user/dtos/create-user.dto';
import { ResponseMessage } from '../common/decorators/message.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MESSAGES } from '../common/constants/messages.constants';
import { ForgotPasswordRequestDto } from './dtos/forgot-password.request.dto';
import { ResetPasswordRequestDto } from './dtos/reset-password.request.dto';
import { VerifyResetTokenRequestDto } from './dtos/verify-reset-token.request.dto';
import { ChangePasswordRequestDto } from './dtos/change-password.request.dto';
import { ConfigService } from '@/config/config.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @UseGuards(AuthGuard('local')) // LocalStrategy
  @Post('login')
  async handleLogin(@Req() req, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req, res);
  }

  @UseGuards(AuthGuard('jwt')) // JwtStrategy
  @ResponseMessage('Logout account')
  @ApiOperation({ summary: 'Logout account' })
  @ApiResponse({ status: 201, description: 'Logout account successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('logout')
  async logout(@User() user: IUser, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(user, res);
  }

  @Post('/register')
  @ResponseMessage('Register a new user')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async handleRegister(@Body() registerDTO: RegisterDto, @Req() req: any) {
    const result = await this.authService.register(registerDTO, req);
    if (!result) {
      throw new BadRequestException(MESSAGES.AUTH.REGISTER_FAILED);
    }
    return result;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {}

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  googleAuthRedirect(@Req() req, @Res() res: Response) {
    // Xử lý login thành công, trả về JWT hoặc redirect về FE
    const { accessToken, refreshToken, user } = req.user;
    const getTime = parseInt(this.configService.getJwtRefreshExpire(), 10);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.getNodeEnv() === 'production', // Only send over HTTPS in production
      sameSite:
        this.configService.getNodeEnv() === 'production' ? 'none' : 'lax',
      maxAge: getTime,
      path: '/',
    });
    const { user_id, fullName, email, role } = user;
    const returnUser = { user_id, fullName, email, role };
    const redirectUrl = `http://localhost:5173/oauth-callback?accessToken=${accessToken}&user=${encodeURIComponent(JSON.stringify(returnUser))}`;
    return res.redirect(redirectUrl);
    // return req.user;
  }

  @ResponseMessage('Verify email')
  @ApiOperation({ summary: 'Verify a new user account' })
  @ApiResponse({ status: 201, description: 'User verified.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Get('verify-email')
  async verifyEmail(
    @Query('email') email: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    try {
      await this.authService.verifyEmail(email, token);
      const feDomain =
        this.configService.get('FE_DOMAIN') || 'http://localhost:3000';
      return res.redirect(
        `${feDomain}/verify-success?email=${encodeURIComponent(email)}`,
      );
    } catch (err) {
      const feDomain =
        this.configService.get('FE_DOMAIN') || 'http://localhost:3000';
      return res.redirect(
        `${feDomain}/verify-fail?email=${encodeURIComponent(email)}&error=${encodeURIComponent(err.message)}`,
      );
    }
  }

  @Post('forgot-password')
  @ResponseMessage('Send reset password email')
  @ApiOperation({ summary: 'Send reset password email' })
  @ApiResponse({ status: 201, description: 'Reset email sent successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordRequestDto,
    @Req() req: any,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto, req);
  }

  @Post('verify-reset-token')
  @ResponseMessage('Verify reset password token')
  @ApiOperation({ summary: 'Verify reset password token' })
  @ApiResponse({ status: 201, description: 'Token is valid.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyResetToken(
    @Body() verifyResetTokenDto: VerifyResetTokenRequestDto,
  ) {
    return this.authService.verifyResetToken(verifyResetTokenDto);
  }

  @Post('reset-password')
  @ResponseMessage('Reset password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 201, description: 'Password reset successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordRequestDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(AuthGuard('jwt')) // JwtStrategy
  @Post('change-password')
  @ResponseMessage('Change password')
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 201, description: 'Password changed successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordRequestDto,
    @User() user: IUser,
  ) {
    return this.authService.changePassword(changePasswordDto, user);
  }

  @Post('refresh-token')
  @ResponseMessage('Refresh access token')
  @ApiOperation({
    summary: 'Refresh access token using refresh token from cookie',
  })
  @ApiResponse({ status: 201, description: 'Token refreshed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired refresh token' })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Get refresh token from httpOnly cookie
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token not found in cookie');
    }

    return this.authService.refreshToken(refreshToken, res);
  }
}
