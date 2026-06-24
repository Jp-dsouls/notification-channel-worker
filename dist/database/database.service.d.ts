import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface NotificationLog {
    notificationId: string;
    productId: string;
    channel: string;
    destination: string;
    status: 'sent' | 'failed' | 'retrying';
    attempts: number;
    error: string | null;
    correlationId: string;
    timestamp: Date;
}
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private connection;
    private notificationLogModel;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    createLog(log: NotificationLog): Promise<NotificationLog>;
    updateLog(notificationId: string, update: Partial<NotificationLog>): Promise<NotificationLog | null>;
    findByNotificationId(notificationId: string): Promise<NotificationLog | null>;
    findByCorrelationId(correlationId: string): Promise<NotificationLog[]>;
    findByProductId(productId: string): Promise<NotificationLog[]>;
    private disconnect;
}
