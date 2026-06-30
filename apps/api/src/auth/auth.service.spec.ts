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
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwtService: { sign: jest.Mock };

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
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'dev-dev-dev-dev-dev-dev-dev-dev-dev-dev-dev-dev-dev';
              if (key === 'JWT_ACCESS_EXPIRES_IN') return '7d';
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
      expect.objectContaining({ secret: expect.any(String), expiresIn: '7d' }),
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
});
