"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = exports.logger = void 0;
const pino_1 = require("pino");
const pino_caller_1 = require("pino-caller");
const date_fns_1 = require("date-fns");
const path_1 = require("path");
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVICE_NAME = process.env.SERVICE_NAME || 'channel-worker';
const options = {
    level: LOG_LEVEL,
    timestamp: () => `,"time":"${(0, date_fns_1.format)(new Date(), 'dd-MM-yyyy HH:mm:ss.SSS')}"`,
    formatters: {
        level: (label) => ({ level: label }),
        log: (obj) => {
            if (obj.caller) {
                const callerInfo = obj.caller.split(path_1.default.sep).pop();
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
    transport: NODE_ENV !== 'production'
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
exports.logger = (0, pino_caller_1.pinoCaller)((0, pino_1.pino)(options));
const getLogger = (correlationId, context) => {
    const child = exports.logger.child({
        correlationId: correlationId || 'N/A',
        context: context || 'App',
    });
    return child;
};
exports.getLogger = getLogger;
//# sourceMappingURL=logger.js.map