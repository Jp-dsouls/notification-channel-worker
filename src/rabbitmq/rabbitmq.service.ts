import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

export interface NotificationMessage {
  notificationId: string;
  productId: string;
  channel: string;
  destination: string;
  content: string;
  timestamp: string;
  correlationId: string;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: any = null;
  private channel: any = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
    await this.setupQueue();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    const host = this.configService.get<string>('RABBITMQ_HOST') || 'localhost';
    const port = this.configService.get<string>('RABBITMQ_PORT') || '5672';
    const user = this.configService.get<string>('RABBITMQ_USER') || 'guest';
    const password = this.configService.get<string>('RABBITMQ_PASSWORD') || 'guest';

    const url = `amqp://${user}:${password}@${host}:${port}`;

    try {
      this.connection = await amqplib.connect(url);
      this.channel = await this.connection.createChannel();

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'channel-worker',
          context: 'RabbitMQService',
          message: 'Connected to RabbitMQ',
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          service: 'channel-worker',
          context: 'RabbitMQService',
          message: 'Failed to connect to RabbitMQ',
          error: error.message,
        }),
      );
      throw error;
    }
  }

  private async setupQueue() {
    const queue = this.configService.get<string>('RABBITMQ_QUEUE') || 'notifications';
    const deadLetterQueue = this.configService.get<string>('RABBITMQ_DEAD_LETTER_QUEUE') || 'notifications.dead-letter';

    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    // Declarar dead letter queue
    await this.channel.assertQueue(deadLetterQueue, {
      durable: true,
    });

    // Declarar queue principal con dead letter exchange
    await this.channel.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': deadLetterQueue,
        'x-max-length': 10000,
      },
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'channel-worker',
        context: 'RabbitMQService',
        message: `Queue "${queue}" and dead letter queue "${deadLetterQueue}" setup`,
      }),
    );
  }

  async consume(
    callback: (message: NotificationMessage) => Promise<void>,
  ): Promise<void> {
    const queue = this.configService.get<string>('RABBITMQ_QUEUE') || 'notifications';

    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.consume(
      queue,
      async (message: any) => {
        if (message) {
          try {
            const content: NotificationMessage = JSON.parse(
              message.content.toString(),
            );

            console.log(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'channel-worker',
                context: 'RabbitMQService.consume',
                correlationId: content.correlationId,
                notificationId: content.notificationId,
                channel: content.channel,
                message: 'Message received from queue',
              }),
            );

            await callback(content);

            this.channel.ack(message);

            console.log(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'channel-worker',
                context: 'RabbitMQService.consume',
                correlationId: content.correlationId,
                notificationId: content.notificationId,
                message: 'Message acknowledged',
              }),
            );
          } catch (error) {
            console.error(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                service: 'channel-worker',
                context: 'RabbitMQService.consume',
                correlationId: 'N/A',
                message: 'Failed to process message',
                error: error.message,
              }),
            );

            this.channel.nack(message, false, false);
          }
        }
      },
      {
        noAck: false,
      },
    );

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'channel-worker',
        context: 'RabbitMQService.consume',
        message: `Waiting for messages in queue "${queue}"`,
      }),
    );
  }

  async sendToDeadLetterQueue(message: NotificationMessage): Promise<void> {
    const deadLetterQueue = this.configService.get<string>('RABBITMQ_DEAD_LETTER_QUEUE') || 'notifications.dead-letter';

    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    this.channel.sendToQueue(
      deadLetterQueue,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
      },
    );

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        service: 'channel-worker',
        context: 'RabbitMQService.sendToDeadLetterQueue',
        correlationId: message.correlationId,
        notificationId: message.notificationId,
        message: 'Message sent to dead letter queue',
      }),
    );
  }

  private async disconnect() {
    if (this.connection) {
      await this.connection.close();
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'channel-worker',
          context: 'RabbitMQService',
          message: 'Disconnected from RabbitMQ',
        }),
      );
    }
  }
}
