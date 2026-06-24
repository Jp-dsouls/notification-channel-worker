import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'channel-worker',
      context: 'Bootstrap',
      message: 'Channel worker started',
    }),
  );

  // Mantener el proceso vivo
  await new Promise<void>((resolve) => {
    process.on('SIGINT', () => {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'channel-worker',
          context: 'Bootstrap',
          message: 'Shutting down gracefully',
        }),
      );
      resolve();
    });

    process.on('SIGTERM', () => {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'channel-worker',
          context: 'Bootstrap',
          message: 'Shutting down gracefully',
        }),
      );
      resolve();
    });
  });

  await app.close();
}

bootstrap();
