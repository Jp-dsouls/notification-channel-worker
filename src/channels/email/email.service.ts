import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationMessage } from '../../rabbitmq/rabbitmq.service';
import { EmailSendException } from '../../common/exceptions/channel-worker.exceptions';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT')),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async send(message: NotificationMessage): Promise<void> {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'channel-worker',
        context: 'EmailService.send',
        correlationId: message.correlationId,
        notificationId: message.notificationId,
        destination: message.destination,
        message: 'Sending email',
      }),
    );

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_USER'),
        to: message.destination,
        subject: 'Notification',
        text: message.content,
        html: `<p>${message.content}</p>`,
      });

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'channel-worker',
          context: 'EmailService.send',
          correlationId: message.correlationId,
          notificationId: message.notificationId,
          destination: message.destination,
          message: 'Email sent successfully',
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          service: 'channel-worker',
          context: 'EmailService.send',
          correlationId: message.correlationId,
          notificationId: message.notificationId,
          destination: message.destination,
          message: 'Failed to send email',
          error: error.message,
        }),
      );

      throw new EmailSendException(message.destination, error.message);
    }
  }
}
