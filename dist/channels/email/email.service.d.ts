import { ConfigService } from '@nestjs/config';
import { NotificationMessage } from '../../rabbitmq/rabbitmq.service';
export declare class EmailService {
    private readonly configService;
    private transporter;
    constructor(configService: ConfigService);
    send(message: NotificationMessage): Promise<void>;
}
