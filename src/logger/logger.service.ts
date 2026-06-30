import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { getLogger } from './logger';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context = 'App';

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, correlationId?: string) {
    getLogger(correlationId, this.context).info(message);
  }

  error(message: string, trace?: string, correlationId?: string) {
    getLogger(correlationId, this.context).error({
      msg: message,
      trace,
    });
  }

  warn(message: string, correlationId?: string) {
    getLogger(correlationId, this.context).warn(message);
  }

  debug(message: string, correlationId?: string) {
    getLogger(correlationId, this.context).debug(message);
  }

  verbose(message: string, correlationId?: string) {
    getLogger(correlationId, this.context).trace(message);
  }
}
