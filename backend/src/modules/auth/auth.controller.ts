import { Body, Controller, Get, Post, Response, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';

import { JWT_EXPIRY_SECONDS } from '../../shared/constants/global.constants';

import { AuthService } from './auth.service';
import {
  AuthResponseDTO,
  FirstLoginDTO,
  LoginUserDTO,
  RegenerateOtpDTO,
  RegisterUserDTO,
  VerifyLoginOtpDTO,
} from './auth.dto';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from './auth.jwt.guard';
import { AuthUser } from './auth.user.decorator';
import { CheckPermissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('login')
  @ApiOperation({ description: 'Login user — step 1 (password). May return OTP challenge.' })
  @ApiBody({ type: LoginUserDTO })
  @ApiResponse({ type: AuthResponseDTO })
  async login(
    @Body() user: LoginUserDTO,
    @Response() res,
  ): Promise<any> {
    const outcome = await this.authService.login(user);

    if ('requireOtp' in outcome || 'requirePasswordChange' in outcome) {
      // No session yet — wait for OTP verify / password change.
      return res.status(200).send(outcome);
    }

    res.cookie('accessToken', outcome.accessToken, {
      expires: new Date(new Date().getTime() + JWT_EXPIRY_SECONDS * 1000),
      sameSite: 'strict',
      secure: true,
      httpOnly: true,
    });

    await this.auditService.log('User logged in', outcome.user.id);

    return res.status(200).send(outcome);
  }

  @Post('verify-otp')
  @ApiOperation({ description: 'Login step 2 — verify 2FA OTP and issue access token' })
  @ApiBody({ type: VerifyLoginOtpDTO })
  async verifyOtp(
    @Body() dto: VerifyLoginOtpDTO,
    @Response() res,
  ): Promise<AuthResponseDTO> {
    const data = await this.authService.verifyLoginOtp(dto);
    res.cookie('accessToken', data.accessToken, {
      expires: new Date(new Date().getTime() + JWT_EXPIRY_SECONDS * 1000),
      sameSite: 'strict',
      secure: true,
      httpOnly: true,
    });
    await this.auditService.log('User logged in (2FA)', data.user.id);
    return res.status(200).send(data);
  }

  @Post('register')
  async register(@Body() user: RegisterUserDTO): Promise<User> {
    const newUser = await this.authService.register(user);
    await this.auditService.log('User registered', newUser.id);
    return newUser;
  }

  @Post('first-login')
  @ApiOperation({
    description: 'Activate account on first login: consume OTP and set new password',
  })
  @ApiBody({ type: FirstLoginDTO })
  async firstLogin(
    @Body() dto: FirstLoginDTO,
    @Response() res,
  ): Promise<AuthResponseDTO> {
    const data = await this.authService.firstLogin(dto);
    res.cookie('accessToken', data.accessToken, {
      expires: new Date(new Date().getTime() + JWT_EXPIRY_SECONDS * 1000),
      sameSite: 'strict',
      secure: true,
      httpOnly: true,
    });
    await this.auditService.log('First-login OTP consumed', data.user.id);
    return res.status(200).send(data);
  }

  @Post('regenerate-otp')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions({ module: 'employees', action: 'manage' })
  @ApiOperation({ description: 'HR Admin: regenerate first-login OTP for a user' })
  @ApiBody({ type: RegenerateOtpDTO })
  async regenerateOtp(
    @Body() dto: RegenerateOtpDTO,
    @AuthUser() actor: User,
  ): Promise<{ otp: string; expiresAt: Date }> {
    const result = await this.authService.regenerateOtp(dto.userId);
    await this.auditService.log(
      `OTP regenerated for user ${dto.userId} by ${actor.id}`,
      actor.id,
    );
    return result;
  }

  @Post('logout')
  logout(@Response() res): void {
    res.clearCookie('accessToken');
    res.status(200).send({ success: true });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ description: 'Get current user profile' })
  async getMe(@AuthUser() user: User): Promise<User> {
    return user;
  }
}
