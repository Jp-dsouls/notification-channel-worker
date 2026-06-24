import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { ChannelDispatcherService } from '../channels/channel-dispatcher.service';
import { DatabaseService } from '../database/database.service';
export declare class NotificationProcessor implements OnModuleInit {
    private readonly rabbitMQService;
    private readonly channelDispatcherService;
    private readonly databaseService;
    private readonly configService;
    private maxRetries;
    constructor(rabbitMQService: RabbitMQService, channelDispatcherService: ChannelDispatcherService, databaseService: DatabaseService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    private processMessage;
}
