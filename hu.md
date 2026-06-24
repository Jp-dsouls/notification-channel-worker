ÉPICA 5: Procesamiento por Canal
HU-5.1: Consumo de Cola y Despacho

Como worker, quiero consumir mensajes de la cola y despacharlos al canal correspondiente.

Criterios de aceptación:

 Consume mensajes de la cola notifications en RabbitMQ
 Identifica el channel del mensaje y lo routing al módulo correcto
 Módulo email: envía vía SMTP (configurable: host, puerto, credenciales)
 Módulo sms: envía vía API del proveedor (configurable: URL, API key)
 Módulo whatsapp: envía vía API del proveedor (configurable: URL, token)
 Si el envío falla → reintento con backoff exponencial (máx 3 intentos)
 Si falla definitivamente → mueve a dead letter queue
HU-5.2: Registro de Logs en MongoDB

Como worker, quiero registrar cada intento de envío en MongoDB para auditoría y métricas.

Criterios de aceptación:

 Cada mensaje procesado genera un documento en MongoDB:
{
  "notification_id": "uuid",
  "product_id": "uuid",
  "channel": "email|sms|whatsapp",
  "destination": "destino",
  "status": "sent|failed|retrying",
  "attempts": 1,
  "error": null,
  "timestamp": "ISO8601"
}
 Cada reintento actualiza el documento (incrementa attempts)
 Emite evento al realtime-server con el resultado