import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { HealthResponse } from './health.types';

/**
 * Boot fails if the database is unreachable (PrismaService.onModuleInit).
 * At runtime, a lost DB connection yields status `degraded` on GET /health.
 */
@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponse> {
    const dbHealthy = await this.prisma.isHealthy();

    return {
      status: dbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected',
    };
  }
}
