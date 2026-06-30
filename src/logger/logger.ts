import { pino } from 'pino';
import { pinoCaller } from 'pino-caller';
import { format } from 'date-fns';
import path from 'path';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVICE_NAME = process.env.SERVICE_NAME || 'channel-worker';

const options = {
  level: LOG_LEVEL,
  timestamp: () => `,"time":"${format(new Date(), 'dd-MM-yyyy HH:mm:ss.SSS')}"`,
  formatters: {
    level: (label: string) => ({ level: label }),
    log: (obj: any) => {
      if (obj.caller) {
        const callerInfo = obj.caller.split(path.sep).pop();
        const callerParts = callerInfo.split(':');
        const file = callerParts[0];
        const line = callerParts[1];
        return {
          ...obj,
          caller: `${file}:${line}`,
          service: SERVICE_NAME,
        };
      }
      return {
        ...obj,
        service: SERVICE_NAME,
      };
    },
  },
  transport:
    NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'dd-MM-yyyy HH:mm:ss.SSS',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
};

export const logger = pinoCaller(pino(options));

export const getLogger = (correlationId?: string, context?: string) => {
  const child = logger.child({
    correlationId: correlationId || 'N/A',
    context: context || 'App',
  });
  return child;
};
