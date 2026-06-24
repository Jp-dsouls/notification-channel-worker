import { Module } from '@nestjs/common';
import { EmailModule } from './email/email.module';
import { SmsModule } from './sms/sms.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ChannelDispatcherService } from './channel-dispatcher.service';

@Module({
  imports: [EmailModule, SmsModule, WhatsappModule],
  providers: [ChannelDispatcherService],
  exports: [ChannelDispatcherService],
})
export class ChannelsModule {}
