import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import type { EnvConfig } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvConfig, true>);
  app.useGlobalFilters(new HttpExceptionFilter(configService));
  const port = configService.get('PORT', { infer: true });
  await app.listen(port);
}

bootstrap();
