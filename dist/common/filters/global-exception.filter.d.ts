import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export interface ErrorResponse {
    statusCode: number;
    error: string;
    message: string | string[];
    timestamp: string;
    correlationId: string;
}
export declare class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): ErrorResponse;
    private getErrorName;
}
