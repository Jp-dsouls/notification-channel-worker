import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface NotificationMessage {
    notificationId: string;
    productId: string;
    channel: string;
    destination: string;
    content: string;
    timestamp: string;
    correlationId: string;
}
export declare class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private connection;
    private channel;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    private setupQueue;
    consume(callback: (message: NotificationMessage) => Promise<void>): Promise<void>;
    sendToDeadLetterQueue(message: NotificationMessage): Promise<void>;
    private disconnect;
}
