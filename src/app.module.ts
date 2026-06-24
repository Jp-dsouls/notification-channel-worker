import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { ProcessorsModule } from './processors/processors.module';
import { ChannelsModule } from './channels/channels.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RabbitMQModule,
    ProcessorsModule,
    ChannelsModule,
    DatabaseModule,
  ],
})
export class AppModule {}
