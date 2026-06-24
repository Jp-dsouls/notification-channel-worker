import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NotificationMessage } from '../../rabbitmq/rabbitmq.service';
import { WhatsappSendException } from '../../common/exceptions/channel-worker.exceptions';

@Injectable()
export class WhatsappService {
  constructor(private readonly configService: ConfigService) {}

  async send(message: NotificationMessage): Promise<void> {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'channel-worker',
        context: 'WhatsappService.send',
        correlationId: message.correlationId,
        notificationId: message.notificationId,
        destination: message.destination,
        message: 'Sending WhatsApp message',
      }),
    );

    try {
      const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
      const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
      const providerUrl = this.configService.get<string>('WHATSAPP_PROVIDER_URL');

      const url = `${providerUrl}/${phoneNumberId}/messages`;

      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: message.destination,
          type: 'text',
          text: {
            body: message.content,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'channel-worker',
          context: 'WhatsappService.send',
          correlationId: message.correlationId,
          notificationId: message.notificationId,
          destination: message.destination,
          message: 'WhatsApp message sent successfully',
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          service: 'channel-worker',
          context: 'WhatsappService.send',
          correlationId: message.correlationId,
          notificationId: message.notificationId,
          destination: message.destination,
          message: 'Failed to send WhatsApp message',
          error: error.message,
        }),
      );

      throw new WhatsappSendException(message.destination, error.message);
    }
  }
}
