import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';
import { sendResponse } from '../send-response';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  // === normalize error response ===
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload: ApiResponse<null> = {
      success: false,
      message: this.getMessage(exception),
      data: null,
      statusCode,
    };

    response.status(statusCode).json(sendResponse(payload));
  }

  // === resolve error message ===
  private getMessage(exception: unknown) {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const errorResponse = exception.getResponse();

    if (typeof errorResponse === 'string') {
      return errorResponse;
    }

    if (
      typeof errorResponse === 'object' &&
      errorResponse !== null &&
      'message' in errorResponse
    ) {
      const message = errorResponse.message;

      if (Array.isArray(message)) {
        return message.join(', ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return exception.message;
  }
}
