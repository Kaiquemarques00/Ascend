import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';
import type { EnvConfig } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthResponseDto, AuthUserDto, JwtPayload } from './auth.types';
import { GoogleAuthService } from './google/google-auth.service';
import {
  expiresAtFromDuration,
  generateRefreshToken,
  hashRefreshToken,
} from './refresh/refresh-token.util';
import { googleAuthSchema } from './schemas/google-auth.schema';
import { loginSchema, type LoginInput } from './schemas/login.schema';
import { refreshSchema } from './schemas/refresh.schema';
import { registerSchema, type RegisterInput } from './schemas/register.schema';
import { updateProfileSchema } from './schemas/update-profile.schema';

const BCRYPT_COST = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  async register(input: unknown): Promise<AuthResponseDto> {
    const dto = this.parseRegister(input);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
    });

    return this.issueTokens(user);
  }

  async login(input: unknown): Promise<AuthResponseDto> {
    const dto = this.parseLogin(input);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Use Google or Apple to sign in');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user);
  }

  async loginWithGoogle(input: unknown): Promise<AuthResponseDto> {
    const parsed = googleAuthSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException(this.formatZodError(parsed.error));
    }

    const profile = await this.googleAuthService.verifyIdToken(parsed.data.idToken);

    const existingByGoogleId = await this.prisma.user.findUnique({
      where: { googleId: profile.sub },
    });

    if (existingByGoogleId) {
      return this.issueTokens(existingByGoogleId);
    }

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingByEmail) {
      if (existingByEmail.googleId && existingByEmail.googleId !== profile.sub) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const linkedUser = await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: profile.sub,
          name: existingByEmail.name || profile.name,
        },
      });

      return this.issueTokens(linkedUser);
    }

    const newUser = await this.prisma.user.create({
      data: {
        name: profile.name,
        email: profile.email,
        googleId: profile.sub,
      },
    });

    return this.issueTokens(newUser);
  }

  async refresh(input: unknown): Promise<AuthResponseDto> {
    const parsed = refreshSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException(this.formatZodError(parsed.error));
    }

    const tokenHash = hashRefreshToken(parsed.data.refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }

      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.issueTokens(stored.user);
  }

  async logout(input: unknown): Promise<void> {
    const parsed = refreshSchema.safeParse(input);

    if (!parsed.success) {
      return;
    }

    await this.revokeRefreshToken(parsed.data.refreshToken);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async updateProfile(userId: string, input: unknown): Promise<AuthUserDto> {
    const parsed = updateProfileSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException(this.formatZodError(parsed.error));
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: parsed.data.name },
    });

    return this.toAuthUserDto(user);
  }

  toAuthUserDto(user: User): AuthUserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  }

  async issueTokens(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET', { infer: true }),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', { infer: true }),
    });

    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = expiresAtFromDuration(
      this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true }),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toAuthUserDto(user),
    };
  }

  private async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  private parseRegister(input: unknown): RegisterInput {
    const parsed = registerSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException(this.formatZodError(parsed.error));
    }

    return parsed.data;
  }

  private parseLogin(input: unknown): LoginInput {
    const parsed = loginSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException(this.formatZodError(parsed.error));
    }

    return parsed.data;
  }

  private formatZodError(error: z.ZodError): string {
    return error.issues
      .map((issue) => {
        const field = issue.path.map(String).join('.') || 'input';
        return `${field}: ${issue.message}`;
      })
      .join(', ');
  }
}
