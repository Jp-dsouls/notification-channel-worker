import { Module } from '@nestjs/common';
import { ChannelsModule } from '../channels/channels.module';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [ChannelsModule],
  providers: [NotificationProcessor],
})
export class ProcessorsModule {}
