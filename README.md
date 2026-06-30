# Channel Worker

Worker unificado que consume mensajes de RabbitMQ y despacha notificaciones por canal (Email, SMS, WhatsApp).

## Arquitectura

```
RabbitMQ (notifications) → Channel Worker → Email/SMS/WhatsApp
                              ↓
                         MongoDB (logs)
                              ↓
                    RabbitMQ (notification-events)
                              ↓
                      Realtime Server
```

## Colas de RabbitMQ

| Cola | Propósito |
|------|-----------|
| `notifications` | Cola principal donde notification-api encola mensajes |
| `notifications.dead-letter` | Dead letter queue para mensajes fallidos |
| `notification-events` | Eventos emitidos para realtime-server |

## Formato de Mensaje

```json
{
  "notificationId": "uuid",
  "productId": "uuid",
  "channel": "email|sms|whatsapp",
  "destination": "destino",
  "content": "contenido renderizado",
  "timestamp": "ISO8601",
  "correlationId": "uuid"
}
```

## Lógica de Reintentos

```
Intento 1 → Falla → Espera 1s → Reintento
Intento 2 → Falla → Espera 2s → Reintento
Intento 3 → Falla → Dead Letter Queue
```

- **Máximo de intentos**: 3 (configurable en `RABBITMQ_MAX_RETRIES`)
- **Backoff exponencial**: `2^(intento-1) * 1000ms`
- **Dead Letter Queue**: Mensajes que fallan definitivamente

## Canales Soportados

| Canal | Servicio | Proveedor |
|-------|----------|-----------|
| Email | `EmailService` | SMTP (configurable) |
| SMS | `SmsService` | Twilio |
| WhatsApp | `WhatsappService` | Meta (WhatsApp Business API) |

## Logs en MongoDB

Cada notificación procesada genera un documento:

```json
{
  "notificationId": "uuid",
  "productId": "uuid",
  "channel": "email|sms|whatsapp",
  "destination": "destino",
  "status": "sent|failed|retrying",
  "attempts": 1,
  "error": null,
  "correlationId": "uuid",
  "timestamp": "ISO8601"
}
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `RABBITMQ_HOST` | Host de RabbitMQ | `localhost` |
| `RABBITMQ_PORT` | Puerto de RabbitMQ | `5672` |
| `RABBITMQ_USER` | Usuario de RabbitMQ | `guest` |
| `RABBITMQ_PASSWORD` | Password de RabbitMQ | `guest` |
| `RABBITMQ_QUEUE` | Cola principal | `notifications` |
| `RABBITMQ_DEAD_LETTER_QUEUE` | Dead letter queue | `notifications.dead-letter` |
| `RABBITMQ_MAX_RETRIES` | Máximo de reintentos | `3` |
| `MONGODB_URI` | URI de MongoDB | `mongodb://localhost:27017/notification_logs` |
| `SMTP_HOST` | Host SMTP | - |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMS_ACCOUNT_SID` | Twilio Account SID | - |
| `SMS_AUTH_TOKEN` | Twilio Auth Token | - |
| `WHATSAPP_ACCESS_TOKEN` | Meta Access Token | - |

## Comandos

```bash
# Desarrollo
npm run start:dev

# Build
npm run build

# Producción
npm run start:prod
```
