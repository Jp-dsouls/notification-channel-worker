import { ConfigService } from '@nestjs/config';
import { NotificationMessage } from '../../rabbitmq/rabbitmq.service';
export declare class SmsService {
    private readonly configService;
    constructor(configService: ConfigService);
    send(message: NotificationMessage): Promise<void>;
}
