import { UserRole, UserStatus } from 'src/entity/user.entity';
import {
  IsString,
  MinLength,
  IsEnum,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Prop } from '@nestjs/mongoose';
import { IntakeBatch } from 'src/entity/intake-batches.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ required: false })
  @IsOptional()
  batch?: IntakeBatch;

  @ApiProperty({ required: false })
  @IsDate()
  @IsOptional()
  @Prop()
  dateOfBirth?: Date;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  @IsOptional()
  @Prop({ enum: UserStatus, default: UserStatus.ACTIVE })
  status?: UserStatus;
}

export class RegisterDto extends CreateUserDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isRegister: boolean = true;
}
