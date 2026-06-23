import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { EnvConfig } from '../../config/env.validation';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProduction = this.configService.get('NODE_ENV', { infer: true }) === 'production';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const rawMessage = (exceptionResponse as { message: string | string[] }).message;
        message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
      } else {
        message = exception.message;
      }
    }

    if (!isProduction) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception,
      );
    } else if (!(exception instanceof HttpException)) {
      this.logger.error(`${request.method} ${request.url}`, exception);
    }

    const clientMessage =
      isProduction && statusCode === HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Internal server error'
        : message;

    response.status(statusCode).json({
      statusCode,
      message: clientMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
