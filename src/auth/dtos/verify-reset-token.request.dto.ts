import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyResetTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
