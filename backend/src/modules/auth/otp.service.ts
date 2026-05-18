import { Injectable, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { AuthHelpers } from '../../shared/helpers/auth.helpers';

export const OTP_DEFAULT_TTL_HOURS = 48;
export const OTP_PURPOSE = {
  FIRST_LOGIN: 'first_login',
  PASSWORD_RESET: 'password_reset',
  LOGIN_2FA: 'login_2fa',
} as const;
export const OTP_LOGIN_2FA_TTL_MINUTES = 10;

export type OtpPurpose = typeof OTP_PURPOSE[keyof typeof OTP_PURPOSE];

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  private generatePlaintextOtp(purpose: OtpPurpose): string {
    if (purpose === OTP_PURPOSE.LOGIN_2FA) {
      // 6-digit numeric for 2FA — friendly UX.
      const buf = randomBytes(6);
      let out = '';
      for (let i = 0; i < 6; i++) out += (buf[i] % 10).toString();
      return out;
    }
    // 8-char base32-ish token; uppercase + digits only, easy to dictate.
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const buf = randomBytes(8);
    let out = '';
    for (let i = 0; i < 8; i++) {
      out += alphabet[buf[i] % alphabet.length];
    }
    return out;
  }

  async issue(
    userId: string,
    purpose: OtpPurpose,
    ttlHours: number = OTP_DEFAULT_TTL_HOURS,
  ): Promise<{ otp: string; expiresAt: Date }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });
    if (!user) throw new BadRequestException('User not found');
    if (!user.isActive) throw new BadRequestException('Cannot issue OTP for deactivated user');
    // charge.docx §4.1: deactivated employees cannot receive OTP reset emails.
    if (user.employee && user.employee.status === 'inactive') {
      throw new BadRequestException('Cannot issue OTP for deactivated employee');
    }

    // Invalidate any previous unused OTP for this purpose.
    await this.prisma.oneTimePassword.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });

    const plaintext = this.generatePlaintextOtp(purpose);
    const hashedOtp = await AuthHelpers.hash(plaintext);
    const ttlMs =
      purpose === OTP_PURPOSE.LOGIN_2FA
        ? OTP_LOGIN_2FA_TTL_MINUTES * 60 * 1000
        : ttlHours * 3600 * 1000;
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.prisma.oneTimePassword.create({
      data: { userId, purpose, hashedOtp, expiresAt },
    });

    return { otp: plaintext, expiresAt };
  }

  async consume(
    userId: string,
    plaintext: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    const candidates = await this.prisma.oneTimePassword.findMany({
      where: { userId, purpose, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    for (const otp of candidates) {
      const matches = await AuthHelpers.verify(plaintext, otp.hashedOtp);
      if (matches) {
        await this.prisma.oneTimePassword.update({
          where: { id: otp.id },
          data: { usedAt: new Date() },
        });
        return true;
      }
    }
    return false;
  }
}
