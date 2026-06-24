import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { NotificationMessage } from '../rabbitmq/rabbitmq.service';
export declare class ChannelDispatcherService {
    private readonly emailService;
    private readonly smsService;
    private readonly whatsappService;
    constructor(emailService: EmailService, smsService: SmsService, whatsappService: WhatsappService);
    dispatch(message: NotificationMessage): Promise<void>;
}
