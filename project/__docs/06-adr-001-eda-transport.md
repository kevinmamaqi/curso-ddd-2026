# ADR-001: Transporte EDA con RabbitMQ + Outbox/Inbox + DLQ

## Estado

Aceptado.

## Contexto

El proyecto integra dos bounded contexts (`order-fulfillment-service` e `inventory-service`) con consistencia eventual.
Asumimos entrega **at-least-once** y necesitamos:

- publicación fiable desde transacciones de DB (sin perder eventos)
- idempotencia en consumidores (evitar efectos duplicados)
- estrategia operable de retry/DLQ
- observabilidad para explicar “qué pasó” (métricas + logs + trazas)

## Decisión

Usamos RabbitMQ (AMQP) con:

- Exchange topic: `course.events.v1`
- DLX direct: `course.dlx.v1`
- Outbox (por servicio) para publicar desde DB de forma fiable
- Inbox (por servicio) para deduplicación en consumidores
- Retry por cola usando *retry queues* con TTL y re-publicación a la routing key original
- DLQ por cola para *poison messages*

Los productores/consumidores exponen señales:

- Métricas HTTP: `http_server_requests_total`, `http_server_request_duration_ms_*`
- Métricas EDA (código): `eda_outbox_published_total`, `eda_consumer_messages_total`, histogramas `*_duration_ms_*`
- Métricas RabbitMQ (infra): `rabbitmq_queue_messages_ready`, `rabbitmq_channel_messages_published_total`, `rabbitmq_channel_messages_ack_total`

## Consecuencias

Pros:

- Mensajes no se pierden si el publish falla (Outbox)
- Consumidores seguros ante redelivery (Inbox)
- Fallos transitorios se absorben con retry; fallos permanentes terminan en DLQ
- Se puede diagnosticar con: colas/DLQ + métricas OTEL `eda_*` + logs en Loki

Contras:

- Operación más compleja (colas de retry, DLQ, “replay”)
- Consistencia eventual (el `POST /orders` responde 202 y el estado converge)

## Dónde verlo en el repo

- RabbitMQ topology + retries/DLQ: `project/*/src/infra/messaging/*.ts`
- Outbox publishers: `project/*/src/infra/events/OutboxRabbitPublisher.ts`
- OTEL + métricas: `project/*/src/infra/observability/*`
- Stack local: `project/docker-compose.yml`

