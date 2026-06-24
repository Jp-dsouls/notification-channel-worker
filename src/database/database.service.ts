import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';

export interface NotificationLog {
  notificationId: string;
  productId: string;
  channel: string;
  destination: string;
  status: 'sent' | 'failed' | 'retrying';
  attempts: number;
  error: string | null;
  correlationId: string;
  timestamp: Date;
}

const notificationLogSchema = new mongoose.Schema<NotificationLog>({
  notificationId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  channel: { type: String, required: true, index: true },
  destination: { type: String, required: true },
  status: { type: String, required: true, enum: ['sent', 'failed', 'retrying'] },
  attempts: { type: Number, required: true, default: 1 },
  error: { type: String, default: null },
  correlationId: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true, default: Date.now },
});

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private connection: mongoose.Connection;
  private notificationLogModel: mongoose.Model<NotificationLog>;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    const uri = this.configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/notification_logs';

    try {
      const connection = await mongoose.connect(uri);
      this.connection = connection.connection;

      this.notificationLogModel = this.connection.model<NotificationLog>(
        'NotificationLog',
        notificationLogSchema,
      );

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'channel-worker',
          context: 'DatabaseService',
          message: 'Connected to MongoDB',
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          service: 'channel-worker',
          context: 'DatabaseService',
          message: 'Failed to connect to MongoDB',
          error: error.message,
        }),
      );
      throw error;
    }
  }

  async createLog(log: NotificationLog): Promise<NotificationLog> {
    const notificationLog = new this.notificationLogModel(log);
    return notificationLog.save();
  }

  async updateLog(
    notificationId: string,
    update: Partial<NotificationLog>,
  ): Promise<NotificationLog | null> {
    return this.notificationLogModel.findOneAndUpdate(
      { notificationId },
      { $set: update },
      { new: true },
    );
  }

  async findByNotificationId(notificationId: string): Promise<NotificationLog | null> {
    return this.notificationLogModel.findOne({ notificationId });
  }

  async findByCorrelationId(correlationId: string): Promise<NotificationLog[]> {
    return this.notificationLogModel.find({ correlationId });
  }

  async findByProductId(productId: string): Promise<NotificationLog[]> {
    return this.notificationLogModel.find({ productId });
  }

  private async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'channel-worker',
          context: 'DatabaseService',
          message: 'Disconnected from MongoDB',
        }),
      );
    }
  }
}
