import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAuthService } from './google-auth.service';

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(),
}));

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  let verifyIdToken: jest.Mock;

  beforeEach(async () => {
    verifyIdToken = jest.fn();
    (OAuth2Client as jest.Mock).mockImplementation(() => ({ verifyIdToken }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GOOGLE_CLIENT_ID') return 'google-client-id.apps.googleusercontent.com';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GoogleAuthService>(GoogleAuthService);
  });

  it('returns profile for a valid Google ID token', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-123',
        email: 'user@gmail.com',
        name: 'Google User',
        email_verified: true,
      }),
    });

    const profile = await service.verifyIdToken('valid-token');

    expect(profile).toEqual({
      sub: 'google-sub-123',
      email: 'user@gmail.com',
      name: 'Google User',
    });
    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: 'valid-token',
      audience: ['google-client-id.apps.googleusercontent.com'],
    });
  });

  it('throws UnauthorizedException for invalid Google token', async () => {
    verifyIdToken.mockRejectedValue(new Error('Token expired'));

    await expect(service.verifyIdToken('invalid-token')).rejects.toThrow(
      new UnauthorizedException('Invalid Google token'),
    );
  });

  it('throws UnauthorizedException when Google Sign-In is not configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => undefined),
          },
        },
      ],
    }).compile();

    const unconfigured = module.get<GoogleAuthService>(GoogleAuthService);

    await expect(unconfigured.verifyIdToken('token')).rejects.toThrow(
      new UnauthorizedException('Google Sign-In is not configured'),
    );
  });
});
