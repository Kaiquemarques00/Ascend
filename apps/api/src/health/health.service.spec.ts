import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: { isHealthy: jest.Mock };

  beforeEach(async () => {
    prisma = { isHealthy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('returns ok when database is healthy', async () => {
    prisma.isHealthy.mockResolvedValue(true);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('connected');
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns degraded when database is unhealthy', async () => {
    prisma.isHealthy.mockResolvedValue(false);

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.database).toBe('disconnected');
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
