import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const logger = app.get(LoggerService);
  logger.log('Channel worker started');

  // Mantener el proceso vivo
  await new Promise<void>((resolve) => {
    process.on('SIGINT', () => {
      logger.log('Shutting down gracefully');
      resolve();
    });

    process.on('SIGTERM', () => {
      logger.log('Shutting down gracefully');
      resolve();
    });
  });

  await app.close();
}

bootstrap();
