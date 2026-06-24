"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'channel-worker',
        context: 'Bootstrap',
        message: 'Channel worker started',
    }));
    await new Promise((resolve) => {
        process.on('SIGINT', () => {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'channel-worker',
                context: 'Bootstrap',
                message: 'Shutting down gracefully',
            }));
            resolve();
        });
        process.on('SIGTERM', () => {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'channel-worker',
                context: 'Bootstrap',
                message: 'Shutting down gracefully',
            }));
            resolve();
        });
    });
    await app.close();
}
bootstrap();
//# sourceMappingURL=main.js.map