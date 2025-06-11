import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Schema, Types } from 'mongoose';
import { MESSAGES } from 'src/common/constants/messages.constants';
import { IUser } from 'src/common/interfaces/user.interface';
import { User, UserDocument } from 'src/entity/user.entity';
import { UserInterface } from 'src/types/user.interface';
import { CreateUserDto, RegisterDto } from 'src/user/dtos/create-user.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
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

    return {
      user_id: user_id,
    };
  }
}
