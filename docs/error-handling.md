# Manejo de Errores y Trazabilidad - Channel Worker

## Códigos HTTP Utilizados

### Errores del Cliente (4xx)

| Código | Excepción | Cuándo se usa |
|--------|-----------|---------------|
| 400 Bad Request | `ChannelNotSupportedException` | Canal no soportado (no es email, sms o whatsapp) |

### Errores del Servidor (5xx)

| Código | Excepción | Cuándo se usa |
|--------|-----------|---------------|
| 500 Internal Server Error | `EmailSendException` | Fallo al enviar email |
| 500 Internal Server Error | `SmsSendException` | Fallo al enviar SMS |
| 500 Internal Server Error | `WhatsappSendException` | Fallo al enviar WhatsApp |
| 500 Internal Server Error | `MaxRetriesExceededException` | Máximo de reintentos alcanzado |

---

## Formato de Respuesta de Error

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Failed to send email to \"user@example.com\": Connection timeout",
  "timestamp": "2026-06-22T10:30:00.000Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Trazabilidad con Correlation ID

### ¿Cómo Funciona?

El `channel-worker` **recibe** el correlation ID del mensaje de RabbitMQ (generado por el gateway) y lo usa en todos sus logs y operaciones.

```typescript
// Mensaje recibido de RabbitMQ
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

### Propagación del Correlation ID

```
Gateway → notification-api → RabbitMQ → channel-worker → MongoDB
                                      │
                              correlationId: abc-123
```

1. **Gateway** genera el correlation ID
2. **notification-api** lo incluye en el mensaje de RabbitMQ
3. **channel-worker** lo recibe y lo usa en:
   - Logs de procesamiento
   - Logs de envío por canal
   - Logs de errores
   - Documentos de MongoDB

---

## Excepciones Personalizadas

### Canal

| Excepción | Código | Descripción |
|-----------|--------|-------------|
| `ChannelNotSupportedException` | 400 | Canal no es email, sms o whatsapp |

### Email

| Excepción | Código | Descripción |
|-----------|--------|-------------|
| `EmailSendException` | 500 | Fallo al enviar email vía SMTP |

### SMS

| Excepción | Código | Descripción |
|-----------|--------|-------------|
| `SmsSendException` | 500 | Fallo al enviar SMS vía Twilio |

### WhatsApp

| Excepción | Código | Descripción |
|-----------|--------|-------------|
| `WhatsappSendException` | 500 | Fallo al enviar WhatsApp vía Meta API |

### Reintentos

| Excepción | Código | Descripción |
|-----------|--------|-------------|
| `MaxRetriesExceededException` | 500 | Máximo de reintentos alcanzado (3 intentos) |

---

## Flujo de Procesamiento

### 1. Recepción del Mensaje

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

### 2. Procesamiento

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
  "message": "Processing notification"
}
```

### 3. Envío por Canal

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

### 4. Éxito

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

### 5. Error y Reintento

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

### 6. Máximo de Reintentos Alcanzado

```json
{
  "timestamp": "2026-06-22T10:30:10.000Z",
  "level": "WARN",
  "service": "channel-worker",
  "context": "NotificationProcessor.processMessage",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "notificationId": "660e8400-e29b-41d4-a716-446655440001",
  "attempts": 3,
  "message": "Max retries exceeded, sending to dead letter queue"
}
```

---

## Reintentos con Backoff Exponencial

### Configuración

```env
RABBITMQ_MAX_RETRIES=3
```

### Estrategia

| Intento | Delay | Fórmula |
|---------|-------|---------|
| 1 | 1s | 2^(1-1) * 1000ms |
| 2 | 2s | 2^(2-1) * 1000ms |
| 3 | 4s | 2^(3-1) * 1000ms |

### Flujo de Reintentos

```
Intento 1 → Falla → Espera 1s → Reintento
Intento 2 → Falla → Espera 2s → Reintento
Intento 3 → Falla → Dead Letter Queue
```

---

## Dead Letter Queue

### ¿Cuándo se Usa?

- Máximo de reintentos alcanzado (3 intentos)
- Mensaje no puede ser procesado

### Configuración

```env
RABBITMQ_QUEUE=notifications
RABBITMQ_DEAD_LETTER_QUEUE=notifications.dead-letter
```

### Log de Dead Letter

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

---

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

### Estados

| Estado | Descripción |
|--------|-------------|
| `sent` | Envío exitoso |
| `failed` | Falló después de máximo reintentos |
| `retrying` | En proceso de reintento |

### Índices

- `notificationId` - Búsqueda por notificación
- `productId` - Búsqueda por producto
- `channel` - Búsqueda por canal
- `correlationId` - Búsqueda por trazabilidad

---

## Consultas de Trazabilidad

### Buscar por Correlation ID

```bash
# En channel-worker
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

---

## Implementación Técnica

### Procesador de Notificaciones

```typescript
// src/processors/notification.processor.ts
@Injectable()
export class NotificationProcessor implements OnModuleInit {
  async onModuleInit() {
    await this.rabbitMQService.consume(this.processMessage.bind(this));
  }

  private async processMessage(message: NotificationMessage): Promise<void> {
    const { notificationId, correlationId, channel, destination } = message;

    // Buscar log existente para contar intentos
    const existingLog = await this.databaseService.findByNotificationId(notificationId);
    const attempts = existingLog ? existingLog.attempts + 1 : 1;

    try {
      // Crear o actualizar log
      await this.databaseService.createLog({
        notificationId,
        productId: message.productId,
        channel,
        destination,
        status: attempts > 1 ? 'retrying' : 'sent',
        attempts,
        error: null,
        correlationId,
        timestamp: new Date(),
      });

      // Despachar al canal correspondiente
      await this.channelDispatcherService.dispatch(message);

      // Actualizar log como exitoso
      await this.databaseService.updateLog(notificationId, {
        status: 'sent',
        attempts,
        error: null,
      });
    } catch (error) {
      if (attempts >= this.maxRetries) {
        // Máximo de reintentos alcanzado
        await this.databaseService.updateLog(notificationId, {
          status: 'failed',
          attempts,
          error: error.message,
        });

        await this.rabbitMQService.sendToDeadLetterQueue(message);
      } else {
        // Reintento con backoff exponencial
        await this.databaseService.updateLog(notificationId, {
          status: 'retrying',
          attempts,
          error: error.message,
        });

        const retryDelay = Math.pow(2, attempts - 1) * 1000;
        setTimeout(() => {
          this.rabbitMQService.sendToDeadLetterQueue(message);
        }, retryDelay);
      }
    }
  }
}
```

### Dispatcher de Canales

```typescript
// src/channels/channel-dispatcher.service.ts
@Injectable()
export class ChannelDispatcherService {
  async dispatch(message: NotificationMessage): Promise<void> {
    switch (message.channel.toLowerCase()) {
      case 'email':
        await this.emailService.send(message);
        break;
      case 'sms':
        await this.smsService.send(message);
        break;
      case 'whatsapp':
        await this.whatsappService.send(message);
        break;
      default:
        throw new ChannelNotSupportedException(message.channel);
    }
  }
}
```

---

## Logs Estructurados

### Campos del Log

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `timestamp` | ISO 8601 | Fecha y hora del evento |
| `level` | string | INFO, ERROR, WARN, DEBUG |
| `service` | string | Nombre del microservicio (channel-worker) |
| `context` | string | Clase/método que genera el log |
| `correlationId` | UUID | ID de trazabilidad |
| `notificationId` | UUID | ID único de la notificación |
| `channel` | string | Canal (email, sms, whatsapp) |
| `destination` | string | Destino del mensaje |
| `attempts` | number | Número de intentos |
| `retryDelay` | number | Delay antes del reintento (ms) |
| `message` | string | Descripción del evento |
| `error` | string | Mensaje de error (si aplica) |

---

## Ejemplo de Flujo Completo

### 1. Mensaje Recibido

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

### 2. Procesamiento Iniciado

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
  "message": "Processing notification"
}
```

### 3. Envío de Email

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

### 4. Email Enviado Exitosamente

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

### 5. Log en MongoDB

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

---

## Mejores Prácticas

1. **Siempre incluir correlationId** en todos los logs
2. **Logs estructurados** - Usar JSON para facilitar consultas
3. **Reintentos con backoff** - Evitar saturar servicios externos
4. **Dead letter queue** - No perder mensajes fallidos
5. **MongoDB para auditoría** - Logs persistentes de todas las notificaciones
6. **Índices en MongoDB** - Optimizar consultas por notificationId, correlationId, productId
7. **Graceful shutdown** - Cerrar conexiones correctamente al detener el servicio
