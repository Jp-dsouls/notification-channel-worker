import { Injectable } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { ChannelNotSupportedException } from '../common/exceptions/channel-worker.exceptions';
import { NotificationMessage } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class ChannelDispatcherService {
  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async dispatch(message: NotificationMessage): Promise<void> {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'channel-worker',
        context: 'ChannelDispatcherService.dispatch',
        correlationId: message.correlationId,
        notificationId: message.notificationId,
        channel: message.channel,
        message: 'Dispatching notification to channel',
      }),
    );

    switch (message.channel.toLowerCase()) {
      case 'email':
        await this.emailService.send(message);
        break;
      case 'sms':
        await this.smsService.send(message);
        break;
      case 'whatsapp':
        await this.whatsappService.send(message);
        break;
      default:
        throw new ChannelNotSupportedException(message.channel);
    }
  }
}
