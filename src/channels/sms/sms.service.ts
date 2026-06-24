import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NotificationMessage } from '../../rabbitmq/rabbitmq.service';
import { SmsSendException } from '../../common/exceptions/channel-worker.exceptions';

@Injectable()
export class SmsService {
  constructor(private readonly configService: ConfigService) {}

  async send(message: NotificationMessage): Promise<void> {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'channel-worker',
        context: 'SmsService.send',
        correlationId: message.correlationId,
        notificationId: message.notificationId,
        destination: message.destination,
        message: 'Sending SMS',
      }),
    );

    try {
      const accountSid = this.configService.get<string>('SMS_ACCOUNT_SID') || '';
      const authToken = this.configService.get<string>('SMS_AUTH_TOKEN') || '';
      const fromNumber = this.configService.get<string>('SMS_FROM_NUMBER') || '';
      const providerUrl = this.configService.get<string>('SMS_PROVIDER_URL') || 'https://api.twilio.com';

      const url = `${providerUrl}/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const formData = new URLSearchParams();
      formData.append('To', message.destination);
      formData.append('From', fromNumber);
      formData.append('Body', message.content);

      await axios.post(
        url,
        formData,
        {
          auth: {
            username: accountSid,
            password: authToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'channel-worker',
          context: 'SmsService.send',
          correlationId: message.correlationId,
          notificationId: message.notificationId,
          destination: message.destination,
          message: 'SMS sent successfully',
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          service: 'channel-worker',
          context: 'SmsService.send',
          correlationId: message.correlationId,
          notificationId: message.notificationId,
          destination: message.destination,
          message: 'Failed to send SMS',
          error: error.message,
        }),
      );

      throw new SmsSendException(message.destination, error.message);
    }
  }
}
