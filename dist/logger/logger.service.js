"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const logger_1 = require("./logger");
let LoggerService = class LoggerService {
    constructor() {
        this.context = 'App';
    }
    setContext(context) {
        this.context = context;
    }
    log(message, correlationId) {
        (0, logger_1.getLogger)(correlationId, this.context).info(message);
    }
    error(message, trace, correlationId) {
        (0, logger_1.getLogger)(correlationId, this.context).error({
            msg: message,
            trace,
        });
    }
    warn(message, correlationId) {
        (0, logger_1.getLogger)(correlationId, this.context).warn(message);
    }
    debug(message, correlationId) {
        (0, logger_1.getLogger)(correlationId, this.context).debug(message);
    }
    verbose(message, correlationId) {
        (0, logger_1.getLogger)(correlationId, this.context).trace(message);
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)()
], LoggerService);
//# sourceMappingURL=logger.service.js.map