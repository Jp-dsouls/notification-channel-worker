# Trazabilidad - Channel Worker

## Visión General

El `channel-worker` **recibe** el correlation ID del mensaje de RabbitMQ y lo propaga a través de todos sus logs y operaciones. Este correlation ID fue generado originalmente por el gateway y permite rastrear una operación completa a través de todos los microservicios.

## Flujo de Trazabilidad

```
┌─────────┐     ┌──────────┐     ┌──────────────────┐     ┌───────────────┐
│ Cliente │────▶│ Gateway  │────▶│ notification-api │────▶│ channel-worker│
└─────────┘     └──────────┘     ──────────────────┘     └───────────────┘
       │                │                    │                        │
       │   X-Correlation-ID: abc-123        │                        │
       │────────────────────────────────────────────────────────────▶│
       │                                                             │
       │                    Todos los logs incluyen                  │
       │                    este correlation ID                      │
       │                                                             │
       ▼                                                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        MongoDB (Logs)                                   │
│  { correlationId: "abc-123", service: "gateway", ... }                 │
│  { correlationId: "abc-123", service: "notification-api", ... }        │
│  { correlationId: "abc-123", service: "channel-worker", ... }          │
─────────────────────────────────────────────────────────────────────────┘
```

## Recepción del Correlation ID

El channel-worker recibe el correlation ID dentro del mensaje de RabbitMQ:

```typescript
// Mensaje de RabbitMQ
{
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "productId": "prod-123",
  "channel": "email",
  "destination": "user@example.com",
  "content": "Hello {{name}}!",
  "timestamp": "2026-06-22T10:30:00.000Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"  // ← Del gateway
}
```

## Implementación

### Procesador de Notificaciones

```typescript
// src/processors/notification.processor.ts
@Injectable()
export class NotificationProcessor implements OnModuleInit {
  private async processMessage(message: NotificationMessage): Promise<void> {
    const { notificationId, correlationId, channel, destination } = message;

    // El correlationId ya viene en el mensaje
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'channel-worker',
        context: 'NotificationProcessor.processMessage',
        correlationId,  // ← Usado en todos los logs
        notificationId,
        channel,
        destination,
        message: 'Processing notification',
      }),
    );

    try {
      // Procesar y enviar
      await this.channelDispatcherService.dispatch(message);

      // Log de éxito con correlationId
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'channel-worker',
          context: 'NotificationProcessor.processMessage',
          correlationId,
          notificationId,
          message: 'Notification processed successfully',
        }),
      );
    } catch (error) {
      // Log de error con correlationId
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          service: 'channel-worker',
          context: 'NotificationProcessor.processMessage',
          correlationId,
          notificationId,
          message: 'Failed to process notification',
          error: error.message,
        }),
      );
    }
  }
}
```

### Servicio de Email

```typescript
// src/channels/email/email.service.ts
@Injectable()
export class EmailService {
  async send(message: NotificationMessage): Promise<void> {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'channel-worker',
        context: 'EmailService.send',
        correlationId: message.correlationId,  // ← Del mensaje
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
```

## Logs Estructurados

### Log de Recepción

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "channel-worker",
  "context": "RabbitMQService.consume",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "channel": "email",
  "message": "Message received from queue"
}
```

### Log de Procesamiento

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "channel-worker",
  "context": "NotificationProcessor.processMessage",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "channel": "email",
  "destination": "user@example.com",
  "attempts": 1,
  "message": "Processing notification"
}
```

### Log de Envío

```json
{
  "timestamp": "2026-06-22T10:30:01.000Z",
  "level": "INFO",
  "service": "channel-worker",
  "context": "EmailService.send",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "destination": "user@example.com",
  "message": "Sending email"
}
```

### Log de Éxito

```json
{
  "timestamp": "2026-06-22T10:30:02.000Z",
  "level": "INFO",
  "service": "channel-worker",
  "context": "EmailService.send",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "destination": "user@example.com",
  "message": "Email sent successfully"
}
```

### Log de Error

```json
{
  "timestamp": "2026-06-22T10:30:01.000Z",
  "level": "ERROR",
  "service": "channel-worker",
  "context": "EmailService.send",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "destination": "user@example.com",
  "message": "Failed to send email",
  "error": "Connection timeout"
}
```

### Log de Reintento

```json
{
  "timestamp": "2026-06-22T10:30:01.000Z",
  "level": "WARN",
  "service": "channel-worker",
  "context": "NotificationProcessor.processMessage",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "attempts": 1,
  "retryDelay": 1000,
  "message": "Scheduling retry"
}
```

### Log de Dead Letter Queue

```json
{
  "timestamp": "2026-06-22T10:30:10.000Z",
  "level": "WARN",
  "service": "channel-worker",
  "context": "RabbitMQService.sendToDeadLetterQueue",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "message": "Message sent to dead letter queue"
}
```

## Campos del Log

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `timestamp` | ISO 8601 | Fecha y hora del evento |
| `level` | string | INFO, ERROR, WARN, DEBUG |
| `service` | string | Nombre del microservicio (channel-worker) |
| `context` | string | Clase/método que genera el log |
| `correlationId` | UUID | ID de trazabilidad (recibido del mensaje) |
| `notificationId` | UUID | ID único de la notificación |
| `channel` | string | Canal (email, sms, whatsapp) |
| `destination` | string | Destino del mensaje |
| `attempts` | number | Número de intentos |
| `retryDelay` | number | Delay antes del reintento (ms) |
| `message` | string | Descripción del evento |
| `error` | string | Mensaje de error (si aplica) |

## Registro en MongoDB

### Estructura del Documento

```json
{
  "_id": "ObjectId",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "productId": "prod-123",
  "channel": "email",
  "destination": "user@example.com",
  "status": "sent|failed|retrying",
  "attempts": 1,
  "error": null,
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-06-22T10:30:00.000Z"
}
```

### Índices

- `notificationId` - Búsqueda por notificación
- `productId` - Búsqueda por producto
- `channel` - Búsqueda por canal
- `correlationId` - Búsqueda por trazabilidad

## Consultas de Trazabilidad

### Buscar por Correlation ID

```bash
# En logs del channel-worker
grep "550e8400-e29b-41d4-a716-446655440000" logs/channel-worker.json

# En MongoDB
db.notificationLogs.find({ correlationId: "550e8400-e29b-41d4-a716-446655440000" })
```

### Buscar por Notification ID

```bash
# En MongoDB
db.notificationLogs.find({ notificationId: "660e8400-e29b-41d4-a716-446655440001" })
```

### Buscar por Product ID

```bash
# En MongoDB
db.notificationLogs.find({ productId: "prod-123" })
```

## Herramientas de Producción

### Kibana / Elasticsearch

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "service": "channel-worker" } },
        { "match": { "correlationId": "550e8400-e29b-41d4-a716-446655440000" } }
      ]
    }
  }
}
```

### Datadog

```
service:channel-worker correlationId:550e8400-e29b-41d4-a716-446655440000
```

### Grafana Loki

```
{service="channel-worker"} |~ "550e8400-e29b-41d4-a716-446655440000"
```

## Diferencia entre IDs

| ID | Scope | Ejemplo de Uso |
|----|-------|----------------|
| `correlationId` | Flujo completo | Trazar operación de inicio a fin |
| `notificationId` | Notificación específica | Identificar una notificación única |
| `productId` | Producto | Filtrar logs por producto |

### Ejemplo de Relación

```json
{
  "correlationId": "abc-123",
  "notificationId": "notif-456",
  "productId": "prod-789"
}
```

- **correlationId**: Sigue el flujo completo (gateway → api → worker → DB)
- **notificationId**: Identifica esta notificación específica
- **productId**: Indica qué producto envió la notificación

## Ejemplo de Flujo Completo

### 1. Gateway Genera Correlation ID

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "gateway",
  "context": "ApiKeyGuard",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "productId": "prod-123",
  "message": "API Key validated successfully"
}
```

### 2. notification-api Encola Mensaje

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "notification-api",
  "context": "NotificationsService.send",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "message": "Notification queued"
}
```

### 3. channel-worker Recibe Mensaje

```json
{
  "timestamp": "2026-06-22T10:30:00.000Z",
  "level": "INFO",
  "service": "channel-worker",
  "context": "RabbitMQService.consume",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "channel": "email",
  "message": "Message received from queue"
}
```

### 4. channel-worker Procesa y Envía

```json
{
  "timestamp": "2026-06-22T10:30:01.000Z",
  "level": "INFO",
  "service": "channel-worker",
  "context": "EmailService.send",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "destination": "user@example.com",
  "message": "Email sent successfully"
}
```

### 5. MongoDB Registra Log

```json
{
  "_id": "ObjectId(...)",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "productId": "prod-123",
  "channel": "email",
  "destination": "user@example.com",
  "status": "sent",
  "attempts": 1,
  "error": null,
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-06-22T10:30:00.000Z"
}
```

### 6. Buscar Todos los Logs de esta Operación

```bash
grep "550e8400-e29b-41d4-a716-446655440000" logs/*.json
```

Resultado: Verás los logs de gateway, notification-api y channel-worker, mostrando el flujo completo.

## Mejores Prácticas

1. **Siempre incluir correlationId** en todos los logs
2. **Logs estructurados** - Usar JSON para facilitar consultas
3. **MongoDB para auditoría** - Logs persistentes de todas las notificaciones
4. **Índices en MongoDB** - Optimizar consultas por correlationId
5. **Graceful shutdown** - Cerrar conexiones correctamente al detener el servicio
6. **Dead letter queue** - No perder mensajes fallidos
7. **Reintentos con backoff** - Evitar saturar servicios externos
