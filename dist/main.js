"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const logger_service_1 = require("./logger/logger.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const logger = app.get(logger_service_1.LoggerService);
    logger.log('Channel worker started');
    await new Promise((resolve) => {
        process.on('SIGINT', () => {
            logger.log('Shutting down gracefully');
            resolve();
        });
        process.on('SIGTERM', () => {
            logger.log('Shutting down gracefully');
            resolve();
        });
    });
    await app.close();
}
bootstrap();
//# sourceMappingURL=main.js.map