import { LoggerService as NestLoggerService } from '@nestjs/common';
export declare class LoggerService implements NestLoggerService {
    private context;
    setContext(context: string): void;
    log(message: string, correlationId?: string): void;
    error(message: string, trace?: string, correlationId?: string): void;
    warn(message: string, correlationId?: string): void;
    debug(message: string, correlationId?: string): void;
    verbose(message: string, correlationId?: string): void;
}
