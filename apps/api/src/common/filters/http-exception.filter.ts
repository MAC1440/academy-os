import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

type ExceptionResponse = {
  message?: string | string[];
  error?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };
    const details =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as ExceptionResponse);
    const errors = Array.isArray(details.message)
      ? details.message
      : details.message
        ? [details.message]
        : [];

    response.status(status).json({
      success: false,
      message: details.error ?? errors[0] ?? 'Request failed',
      data: null,
      meta: null,
      errors,
    });
  }
}
