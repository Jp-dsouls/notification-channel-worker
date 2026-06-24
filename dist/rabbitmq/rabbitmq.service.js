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
exports.RabbitMQService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib = require("amqplib");
let RabbitMQService = class RabbitMQService {
    constructor(configService) {
        this.configService = configService;
        this.connection = null;
        this.channel = null;
    }
    async onModuleInit() {
        await this.connect();
        await this.setupQueue();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
        const host = this.configService.get('RABBITMQ_HOST') || 'localhost';
        const port = this.configService.get('RABBITMQ_PORT') || '5672';
        const user = this.configService.get('RABBITMQ_USER') || 'guest';
        const password = this.configService.get('RABBITMQ_PASSWORD') || 'guest';
        const url = `amqp://${user}:${password}@${host}:${port}`;
        try {
            this.connection = await amqplib.connect(url);
            this.channel = await this.connection.createChannel();
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'channel-worker',
                context: 'RabbitMQService',
                message: 'Connected to RabbitMQ',
            }));
        }
        catch (error) {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                service: 'channel-worker',
                context: 'RabbitMQService',
                message: 'Failed to connect to RabbitMQ',
                error: error.message,
            }));
            throw error;
        }
    }
    async setupQueue() {
        const queue = this.configService.get('RABBITMQ_QUEUE') || 'notifications';
        const deadLetterQueue = this.configService.get('RABBITMQ_DEAD_LETTER_QUEUE') || 'notifications.dead-letter';
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }
        await this.channel.assertQueue(deadLetterQueue, {
            durable: true,
        });
        await this.channel.assertQueue(queue, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': '',
                'x-dead-letter-routing-key': deadLetterQueue,
                'x-max-length': 10000,
            },
        });
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'channel-worker',
            context: 'RabbitMQService',
            message: `Queue "${queue}" and dead letter queue "${deadLetterQueue}" setup`,
        }));
    }
    async consume(callback) {
        const queue = this.configService.get('RABBITMQ_QUEUE') || 'notifications';
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }
        await this.channel.consume(queue, async (message) => {
            if (message) {
                try {
                    const content = JSON.parse(message.content.toString());
                    console.log(JSON.stringify({
                        timestamp: new Date().toISOString(),
                        level: 'INFO',
                        service: 'channel-worker',
                        context: 'RabbitMQService.consume',
                        correlationId: content.correlationId,
                        notificationId: content.notificationId,
                        channel: content.channel,
                        message: 'Message received from queue',
                    }));
                    await callback(content);
                    this.channel.ack(message);
                    console.log(JSON.stringify({
                        timestamp: new Date().toISOString(),
                        level: 'INFO',
                        service: 'channel-worker',
                        context: 'RabbitMQService.consume',
                        correlationId: content.correlationId,
                        notificationId: content.notificationId,
                        message: 'Message acknowledged',
                    }));
                }
                catch (error) {
                    console.error(JSON.stringify({
                        timestamp: new Date().toISOString(),
                        level: 'ERROR',
                        service: 'channel-worker',
                        context: 'RabbitMQService.consume',
                        correlationId: 'N/A',
                        message: 'Failed to process message',
                        error: error.message,
                    }));
                    this.channel.nack(message, false, false);
                }
            }
        }, {
            noAck: false,
        });
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'channel-worker',
            context: 'RabbitMQService.consume',
            message: `Waiting for messages in queue "${queue}"`,
        }));
    }
    async sendToDeadLetterQueue(message) {
        const deadLetterQueue = this.configService.get('RABBITMQ_DEAD_LETTER_QUEUE') || 'notifications.dead-letter';
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }
        this.channel.sendToQueue(deadLetterQueue, Buffer.from(JSON.stringify(message)), {
            persistent: true,
        });
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'WARN',
            service: 'channel-worker',
            context: 'RabbitMQService.sendToDeadLetterQueue',
            correlationId: message.correlationId,
            notificationId: message.notificationId,
            message: 'Message sent to dead letter queue',
        }));
    }
    async disconnect() {
        if (this.connection) {
            await this.connection.close();
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'channel-worker',
                context: 'RabbitMQService',
                message: 'Disconnected from RabbitMQ',
            }));
        }
    }
};
exports.RabbitMQService = RabbitMQService;
exports.RabbitMQService = RabbitMQService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RabbitMQService);
//# sourceMappingURL=rabbitmq.service.js.map