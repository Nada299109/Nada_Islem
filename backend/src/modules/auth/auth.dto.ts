import { User } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { INVALID_EMAIL } from '../../shared/constants/strings';

export class AuthResponseDTO {
  user: User;
  accessToken: string;
}

export class OtpChallengeResponseDTO {
  requireOtp: true;
  challengeToken: string;
  email: string;
  expiresAt: Date;
}

export class FirstLoginRequiredResponseDTO {
  requirePasswordChange: true;
  email: string;
}

export class VerifyLoginOtpDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  challengeToken: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  otp: string;
}

export class RegisterUserDTO {
  @IsString()
  @ApiProperty()
  email: string;

  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  password: string;
}

export class LoginUserDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @IsEmail({}, { message: INVALID_EMAIL })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  password: string;
}

export class FirstLoginDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @IsEmail({}, { message: INVALID_EMAIL })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  newPassword: string;
}

export class RegenerateOtpDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  userId: string;
}
