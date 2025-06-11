import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  // UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dtos/create-user.dto';
import { User, UserRole } from 'src/entity/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
// import { UserRole } from './schemas/user.schema';

@Controller('users')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  // @Roles(UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  // @Get()
  // @Roles(UserRole.ADMIN, UserRole.STAFF)
  // async findAll(): Promise<User[]> {
  //   return this.userService.findAll();
  // }

  @Get(':id')
  // @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  // @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  // @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
