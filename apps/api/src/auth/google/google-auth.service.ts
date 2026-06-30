import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import type { EnvConfig } from '../../config/env.validation';
import type { GoogleProfile } from './google-auth.types';

@Injectable()
export class GoogleAuthService {
  private readonly clientIds: string[];

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    const fromList = this.configService
      .get('GOOGLE_CLIENT_IDS', { infer: true })
      ?.split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const single = this.configService.get('GOOGLE_CLIENT_ID', { infer: true });

    this.clientIds = fromList?.length ? fromList : single ? [single] : [];
  }

  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    if (!this.clientIds.length) {
      throw new UnauthorizedException('Google Sign-In is not configured');
    }

    try {
      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({
        idToken,
        audience: this.clientIds,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        throw new UnauthorizedException('Invalid Google token');
      }

      if (payload.email_verified === false) {
        throw new UnauthorizedException('Google email not verified');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email.split('@')[0],
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
