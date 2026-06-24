import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService, NotificationMessage } from '../rabbitmq/rabbitmq.service';
import { ChannelDispatcherService } from '../channels/channel-dispatcher.service';
import { DatabaseService, NotificationLog } from '../database/database.service';

@Injectable()
export class NotificationProcessor implements OnModuleInit {
  private maxRetries: number;

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly channelDispatcherService: ChannelDispatcherService,
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.maxRetries = Number(this.configService.get<string>('RABBITMQ_MAX_RETRIES')) || 3;
  }

  async onModuleInit() {
    await this.rabbitMQService.consume(this.processMessage.bind(this));
  }

  private async processMessage(message: NotificationMessage): Promise<void> {
    const { notificationId, correlationId, channel, destination } = message;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'channel-worker',
        context: 'NotificationProcessor.processMessage',
        correlationId,
        notificationId,
        channel,
        destination,
        message: 'Processing notification',
      }),
    );

    // Buscar log existente para contar intentos
    const existingLog = await this.databaseService.findByNotificationId(notificationId);
    const attempts = existingLog ? existingLog.attempts + 1 : 1;

    try {
      // Crear o actualizar log como "retrying" o "pending"
      const log: NotificationLog = {
        notificationId,
        productId: message.productId,
        channel,
        destination,
        status: attempts > 1 ? 'retrying' : 'sent',
        attempts,
        error: null,
        correlationId,
        timestamp: new Date(),
      };

      if (existingLog) {
        await this.databaseService.updateLog(notificationId, log);
      } else {
        await this.databaseService.createLog(log);
      }

      // Despachar al canal correspondiente
      await this.channelDispatcherService.dispatch(message);

      // Actualizar log como "sent" exitoso
      await this.databaseService.updateLog(notificationId, {
        status: 'sent',
        attempts,
        error: null,
      });

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'channel-worker',
          context: 'NotificationProcessor.processMessage',
          correlationId,
          notificationId,
          channel,
          destination,
          attempts,
          message: 'Notification processed successfully',
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          service: 'channel-worker',
          context: 'NotificationProcessor.processMessage',
          correlationId,
          notificationId,
          channel,
          destination,
          attempts,
          message: 'Failed to process notification',
          error: error.message,
        }),
      );

      if (attempts >= this.maxRetries) {
        // Máximo de reintentos alcanzado, enviar a dead letter queue
        console.warn(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'WARN',
            service: 'channel-worker',
            context: 'NotificationProcessor.processMessage',
            correlationId,
            notificationId,
            channel,
            destination,
            attempts,
            message: 'Max retries exceeded, sending to dead letter queue',
          }),
        );

        await this.databaseService.updateLog(notificationId, {
          status: 'failed',
          attempts,
          error: error.message,
        });

        await this.rabbitMQService.sendToDeadLetterQueue(message);
      } else {
        // Actualizar log como "retrying"
        await this.databaseService.updateLog(notificationId, {
          status: 'retrying',
          attempts,
          error: error.message,
        });

        // Re-encolar para reintento (con backoff exponencial simulado)
        const retryDelay = Math.pow(2, attempts - 1) * 1000; // 1s, 2s, 4s...

        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'WARN',
            service: 'channel-worker',
            context: 'NotificationProcessor.processMessage',
            correlationId,
            notificationId,
            channel,
            destination,
            attempts,
            retryDelay,
            message: 'Scheduling retry',
          }),
        );

        setTimeout(() => {
          this.rabbitMQService.sendToDeadLetterQueue(message);
        }, retryDelay);
      }
    }
  }
}
