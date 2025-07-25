import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../entity/user.entity';
import { CreateUserDto, RegisterDto } from './dtos/create-user.dto';
import { MESSAGES } from '../common/constants/messages.constants';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly redisService: RedisService,
  ) {}

  async findOrCreateByGoogle(profile: any): Promise<User> {
    const email = profile.emails[0].value;
    let user = await this.userModel.findOne({ email });

    if (!user) {
      user = new this.userModel({
        email,
        googleId: profile.id,
        fullName: profile.name.givenName,
      });
      await user.save();
    } else {
      const updateUser: Partial<User> = {
        googleId: profile.id,
        fullName: profile.name.givenName,
      };
      await this.updateUser(user._id, updateUser);
    }

    return user;
  }

  async findAllUser(): Promise<User[] | null> {
    return this.redisService.getOrSetCache<User[]>(
      'users:all',
      89400, // TTL 60 giây
      async () => {
        return this.userModel.find().select('+password').lean().exec();
      },
    );
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel
      .findOne({ username })
      .select('+password')
      .lean()
      .exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findOne({ user_id: id }).exec();
  }

  async findOneById(user_id: string): Promise<User | null> {
    return this.userModel.findOne({ user_id: user_id }).lean().exec();
  }

  async createUser(userDTO: CreateUserDto | RegisterDto) {
    const existedUser = await this.findOneByEmail(userDTO.email);
    if (existedUser) {
      throw new BadRequestException(MESSAGES.USERS.EMAIL_EXIST);
    }

    const role =
      userDTO instanceof RegisterDto ? UserRole.STUDENT : userDTO.role;
    const hashedPassword = await bcrypt.hash(userDTO.password, 10);

    const newUser = await this.userModel.create({
      ...userDTO,
      password: hashedPassword,
      role: role || UserRole.STUDENT,
      status: userDTO.status || UserStatus.ACTIVE,
    });

    return {
      user_id: newUser.user_id,
    };
  }

  async updateUser(
    id: string | Types.ObjectId,
    updateData: Partial<User>,
  ): Promise<User | null> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    return this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async updateUserToken(refreshToken: string, user_id: string) {
    return await this.userModel.updateOne(
      { user_id: user_id },
      { $set: { refresh_token: refreshToken } },
    );
  }

  async deleteUser(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async countUsersByRole(role: UserRole): Promise<number> {
    return this.userModel.countDocuments({ role }).exec();
  }

  async findOneByEmail(email: string) {
    return this.userModel.findOne({ email: email }).lean().exec();
  }

  async markAsVerified(userId: string): Promise<void> {
    await this.userModel
      .findOneAndUpdate({ user_id: userId }, { isVerified: true })
      .exec();
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userModel
      .findByIdAndUpdate(userId, { password: hashedPassword })
      .exec();
  }

  isCreateUserDto(obj: unknown): obj is CreateUserDto {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }
    const userObj = obj as Record<string, unknown>;
    return (
      'role' in userObj &&
      typeof userObj.role === 'string' &&
      Object.values(UserRole).includes(userObj.role as UserRole)
    );
  }

  isRegisterDTO(obj: any): obj is RegisterDto {
    return !('role' in obj);
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<User | null> {
    console.log('UPDATEFCMTOKEN');

    return this.userModel
      .findOneAndUpdate({ user_id: userId }, { fcmToken }, { new: true })
      .exec();
  }
}
