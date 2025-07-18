import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dtos/create-user.dto';
import { User, UserRole } from '../entity/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created', type: User })
  @Roles(UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  // @Get()
  // @Roles(UserRole.ADMIN, UserRole.STAFF)
  // @ApiOperation({ summary: 'Lấy danh sách user' })
  // @ApiResponse({ status: 200, description: 'Danh sách user', type: [User] })
  // async findAll(): Promise<User[]> {
  //   return this.userService.findAll();
  // }

  @Get()
  @ApiOperation({ summary: 'Lấy thông tin users' })
  @ApiResponse({ status: 200, description: 'User detail', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.userService.findAllUser();
  }
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin user theo id' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'User detail', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch('fcm-token')
  @ApiOperation({ summary: 'Cập nhật FCM token cho user hiện tại' })
  @ApiBody({ schema: { properties: { fcmToken: { type: 'string' } } } })
  async updateFcmToken(@Req() req, @Body('fcmToken') fcmToken: string) {
    const userId = req.user.user_id;
    return this.userService.updateFcmToken(userId, fcmToken);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật user theo id' })
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa user theo id' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
