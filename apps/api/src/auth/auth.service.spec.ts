import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google/google-auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    refreshToken: {
      findFirst: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let jwtService: { sign: jest.Mock };
  let googleAuthService: { verifyIdToken: jest.Mock };

  const mockUser = {
    id: 'user-uuid-1',
    name: 'Test User',
    email: 'test@ascend.dev',
    passwordHash: '$2b$12$hashed',
    googleId: null,
    appleId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'refresh-uuid-1' }),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    };

    googleAuthService = {
      verifyIdToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: GoogleAuthService, useValue: googleAuthService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'dev-dev-dev-dev-dev-dev-dev-dev-dev-dev-dev-dev-dev-dev';
              if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
              if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a new user and returns access token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(mockUser);

    const result = await service.register({
      name: 'Test User',
      email: 'test@ascend.dev',
      password: 'Test1234',
    });

    expect(result.accessToken).toBe('signed-jwt-token');
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(result.user).toEqual({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      createdAt: mockUser.createdAt.toISOString(),
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Test User',
        email: 'test@ascend.dev',
        passwordHash: expect.any(String),
      }),
    });
  });

  it('throws ConflictException when email is already registered', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      service.register({
        name: 'Another',
        email: 'test@ascend.dev',
        password: 'Test1234',
      }),
    ).rejects.toThrow(new ConflictException('Email already registered'));
  });

  it('throws BadRequestException when password is invalid', async () => {
    await expect(
      service.register({
        name: 'Test User',
        email: 'test@ascend.dev',
        password: 'short',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('logs in with valid credentials and returns access token', async () => {
    const passwordHash = await bcrypt.hash('Test1234', 12);
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash });

    const result = await service.login({
      email: 'test@ascend.dev',
      password: 'Test1234',
    });

    expect(result.accessToken).toBe('signed-jwt-token');
    expect(result.user.email).toBe('test@ascend.dev');
    expect(jwtService.sign).toHaveBeenCalledWith(
      { sub: mockUser.id, email: mockUser.email },
      expect.objectContaining({ secret: expect.any(String), expiresIn: '15m' }),
    );
  });

  it('throws UnauthorizedException for invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@ascend.dev',
        password: 'Test1234',
      }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
  });

  it('throws UnauthorizedException with wrong password', async () => {
    const passwordHash = await bcrypt.hash('Correct1234', 12);
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash });

    await expect(
      service.login({
        email: 'test@ascend.dev',
        password: 'Wrong1234',
      }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
  });

  it('throws OAuth-only message when account has no password hash', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: null });

    await expect(
      service.login({
        email: 'test@ascend.dev',
        password: 'Test1234',
      }),
    ).rejects.toThrow(new UnauthorizedException('Use Google or Apple to sign in'));
  });

  it('hashes passwords with bcrypt', async () => {
    const hash = await service.hashPassword('Test1234');

    expect(hash).toMatch(/^\$2b\$/);
    expect(await bcrypt.compare('Test1234', hash)).toBe(true);
  });

  it('creates a new user from a valid Google ID token', async () => {
    googleAuthService.verifyIdToken.mockResolvedValue({
      sub: 'google-sub-123',
      email: 'google@ascend.dev',
      name: 'Google User',
    });
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValue({
      ...mockUser,
      email: 'google@ascend.dev',
      name: 'Google User',
      googleId: 'google-sub-123',
      passwordHash: null,
    });

    const result = await service.loginWithGoogle({ idToken: 'valid-google-token' });

    expect(result.accessToken).toBe('signed-jwt-token');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Google User',
        email: 'google@ascend.dev',
        googleId: 'google-sub-123',
      },
    });
  });

  it('links Google account to an existing user by email', async () => {
    googleAuthService.verifyIdToken.mockResolvedValue({
      sub: 'google-sub-123',
      email: 'test@ascend.dev',
      name: 'Google User',
    });
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);
    prisma.user.update.mockResolvedValue({
      ...mockUser,
      googleId: 'google-sub-123',
    });

    const result = await service.loginWithGoogle({ idToken: 'valid-google-token' });

    expect(result.accessToken).toBe('signed-jwt-token');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: {
        googleId: 'google-sub-123',
        name: mockUser.name,
      },
    });
  });

  it('logs in an existing Google user', async () => {
    googleAuthService.verifyIdToken.mockResolvedValue({
      sub: 'google-sub-123',
      email: 'google@ascend.dev',
      name: 'Google User',
    });
    prisma.user.findUnique.mockResolvedValueOnce({
      ...mockUser,
      googleId: 'google-sub-123',
      passwordHash: null,
    });

    const result = await service.loginWithGoogle({ idToken: 'valid-google-token' });

    expect(result.accessToken).toBe('signed-jwt-token');
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when Google token verification fails', async () => {
    googleAuthService.verifyIdToken.mockRejectedValue(
      new UnauthorizedException('Invalid Google token'),
    );

    await expect(service.loginWithGoogle({ idToken: 'invalid-token' })).rejects.toThrow(
      new UnauthorizedException('Invalid Google token'),
    );
  });

  it('refreshes tokens with a valid refresh token (rotation)', async () => {
    const future = new Date(Date.now() + 60_000);
    prisma.refreshToken.findFirst.mockResolvedValue({
      id: 'refresh-uuid-1',
      userId: mockUser.id,
      tokenHash: 'hash',
      expiresAt: future,
      user: mockUser,
    });

    const result = await service.refresh({ refreshToken: 'valid-refresh-token' });

    expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'refresh-uuid-1' } });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(result.accessToken).toBe('signed-jwt-token');
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  it('throws UnauthorizedException for expired refresh token', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue({
      id: 'refresh-uuid-1',
      userId: mockUser.id,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() - 60_000),
      user: mockUser,
    });

    await expect(service.refresh({ refreshToken: 'expired-token' })).rejects.toThrow(
      new UnauthorizedException('Invalid or expired refresh token'),
    );
    expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'refresh-uuid-1' } });
  });

  it('throws UnauthorizedException when refresh token was already rotated', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue(null);

    await expect(service.refresh({ refreshToken: 'reused-token' })).rejects.toThrow(
      new UnauthorizedException('Invalid or expired refresh token'),
    );
  });

  it('revokes refresh token on logout', async () => {
    await service.logout({ refreshToken: 'logout-refresh-token' });

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: expect.any(String) },
    });
  });

  it('updates the profile name and returns the updated user', async () => {
    prisma.user.update.mockResolvedValue({ ...mockUser, name: 'New Name' });

    const result = await service.updateProfile(mockUser.id, { name: 'New Name' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { name: 'New Name' },
    });
    expect(result).toEqual({
      id: mockUser.id,
      name: 'New Name',
      email: mockUser.email,
      createdAt: mockUser.createdAt.toISOString(),
    });
  });

  it('trims whitespace from the profile name before saving', async () => {
    prisma.user.update.mockResolvedValue({ ...mockUser, name: 'Trimmed' });

    await service.updateProfile(mockUser.id, { name: '  Trimmed  ' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { name: 'Trimmed' },
    });
  });

  it('throws BadRequestException when the profile name is empty', async () => {
    await expect(service.updateProfile(mockUser.id, { name: '   ' })).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when the profile name exceeds 100 chars', async () => {
    await expect(
      service.updateProfile(mockUser.id, { name: 'a'.repeat(101) }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
