import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  correlationId: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const correlationId = 'N/A';

    let statusCode: number;
    let error: string;
    let message: string | string[];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      error = this.getErrorName(statusCode);

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string | string[]) || exception.message;
        error = (resp.error as string) || error;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal Server Error';
      message = exception.message;
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal Server Error';
      message = 'An unexpected error occurred';
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      correlationId,
    };

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        service: 'channel-worker',
        correlationId,
        statusCode,
        message,
      }),
    );

    return errorResponse;
  }

  private getErrorName(statusCode: number): string {
    const errorNames: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };

    return errorNames[statusCode] || 'Error';
  }
}
