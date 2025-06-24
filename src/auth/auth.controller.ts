import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Request,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { applySmartIdField } from '../common/middleware/assign_custome_id.middleware';
import { User } from '../common/decorators/user.decorator';
import { Response } from 'express';
import { IUser } from '../common/interfaces/user.interface';
import { RegisterDto } from '../user/dtos/create-user.dto';
import { ResponseMessage } from '../common/decorators/message.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MESSAGES } from '../common/constants/messages.constants';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
  async handleRegister(@Body() registerDTO: RegisterDto) {
    const result = await this.authService.register(registerDTO);
    if (!result) {
      throw new BadRequestException(MESSAGES.AUTH.REGISTER_FAILED);
    }
    return result;
  }

  @ResponseMessage('Verify email')
  @ApiOperation({ summary: 'Verify a new user account' })
  @ApiResponse({ status: 201, description: 'User verified.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Get('verify-email')
  async verifyEmail(
    @Query('email') email: string,
    @Query('token') token: string,
  ) {
    return this.authService.verifyEmail(email, token);
  }
}
