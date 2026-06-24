"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rabbitmq_service_1 = require("../rabbitmq/rabbitmq.service");
const channel_dispatcher_service_1 = require("../channels/channel-dispatcher.service");
const database_service_1 = require("../database/database.service");
let NotificationProcessor = class NotificationProcessor {
    constructor(rabbitMQService, channelDispatcherService, databaseService, configService) {
        this.rabbitMQService = rabbitMQService;
        this.channelDispatcherService = channelDispatcherService;
        this.databaseService = databaseService;
        this.configService = configService;
        this.maxRetries = Number(this.configService.get('RABBITMQ_MAX_RETRIES')) || 3;
    }
    async onModuleInit() {
        await this.rabbitMQService.consume(this.processMessage.bind(this));
    }
    async processMessage(message) {
        const { notificationId, correlationId, channel, destination } = message;
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'channel-worker',
            context: 'NotificationProcessor.processMessage',
            correlationId,
            notificationId,
            channel,
            destination,
            message: 'Processing notification',
        }));
        const existingLog = await this.databaseService.findByNotificationId(notificationId);
        const attempts = existingLog ? existingLog.attempts + 1 : 1;
        try {
            const log = {
                notificationId,
                productId: message.productId,
                channel,
                destination,
                status: attempts > 1 ? 'retrying' : 'sent',
                attempts,
                error: null,
                correlationId,
                timestamp: new Date(),
            };
            if (existingLog) {
                await this.databaseService.updateLog(notificationId, log);
            }
            else {
                await this.databaseService.createLog(log);
            }
            await this.channelDispatcherService.dispatch(message);
            await this.databaseService.updateLog(notificationId, {
                status: 'sent',
                attempts,
                error: null,
            });
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'channel-worker',
                context: 'NotificationProcessor.processMessage',
                correlationId,
                notificationId,
                channel,
                destination,
                attempts,
                message: 'Notification processed successfully',
            }));
        }
        catch (error) {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                service: 'channel-worker',
                context: 'NotificationProcessor.processMessage',
                correlationId,
                notificationId,
                channel,
                destination,
                attempts,
                message: 'Failed to process notification',
                error: error.message,
            }));
            if (attempts >= this.maxRetries) {
                console.warn(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level: 'WARN',
                    service: 'channel-worker',
                    context: 'NotificationProcessor.processMessage',
                    correlationId,
                    notificationId,
                    channel,
                    destination,
                    attempts,
                    message: 'Max retries exceeded, sending to dead letter queue',
                }));
                await this.databaseService.updateLog(notificationId, {
                    status: 'failed',
                    attempts,
                    error: error.message,
                });
                await this.rabbitMQService.sendToDeadLetterQueue(message);
            }
            else {
                await this.databaseService.updateLog(notificationId, {
                    status: 'retrying',
                    attempts,
                    error: error.message,
                });
                const retryDelay = Math.pow(2, attempts - 1) * 1000;
                console.log(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level: 'WARN',
                    service: 'channel-worker',
                    context: 'NotificationProcessor.processMessage',
                    correlationId,
                    notificationId,
                    channel,
                    destination,
                    attempts,
                    retryDelay,
                    message: 'Scheduling retry',
                }));
                setTimeout(() => {
                    this.rabbitMQService.sendToDeadLetterQueue(message);
                }, retryDelay);
            }
        }
    }
};
exports.NotificationProcessor = NotificationProcessor;
exports.NotificationProcessor = NotificationProcessor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rabbitmq_service_1.RabbitMQService,
        channel_dispatcher_service_1.ChannelDispatcherService,
        database_service_1.DatabaseService,
        config_1.ConfigService])
], NotificationProcessor);
//# sourceMappingURL=notification.processor.js.map