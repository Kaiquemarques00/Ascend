import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';
import type { HealthResponse } from './health.types';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(@Res({ passthrough: true }) res: Response): Promise<HealthResponse> {
    const health = await this.healthService.check();

    if (health.status === 'degraded') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return health;
  }
}
