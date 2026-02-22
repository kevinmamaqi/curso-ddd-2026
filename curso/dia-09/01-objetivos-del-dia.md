# Sesión 9 · Martes 24-feb-2026  
**Duración:** 16:00 – 19:00
**Tema global:** *Monitorización, troubleshooting y resiliencia en EDA (RabbitMQ + OTEL)*

**Temario (referencia):**
- [5 · Tolerancia a fallos y resiliencia en microservicios](../../NUEVO_TEMARIO.md#5-tolerancia-a-fallos-y-resiliencia-en-microservicios)
  - Manejo de fallas y errores en microservicios
  - Estrategias de recuperación y reintentos en microservicios
  - Pruebas de resiliencia y recuperación en microservicios
  - Diseño de sistemas anti-fragiles en microservicios
- [7 · Monitorización y solución de problemas en microservicios](../../NUEVO_TEMARIO.md#7-monitorización-y-solución-de-problemas-en-microservicios)
  - Uso de herramientas de monitorización y registro de logs
  - Análisis y solución de problemas en microservicios
  - Identificación y resolución de cuellos de botella y cuellos de rendimiento
  - Detección y prevención de fallas en microservicios
  - Monitoreo y control de métricas en entornos de microservicios
- [13 · Patrones de comunicación en DDD](../../NUEVO_TEMARIO.md#13-patrones-de-comunicación-en-ddd)
  - Traducción de modelos con estado
  - Bandeja de salida
  - Gestión de procesos

## Objetivos y agenda

- Continuar la exploración de EDA, centrándonos en la implementación práctica de la robustez y la observabilidad.
- Implementar estrategias efectivas de manejo de errores, incluyendo colas de mensajes fallidos (DLX/Poison Queues) y políticas de reintentos.
- Gestionar la evolución de los esquemas de eventos sin romper los consumidores.
- Introducir la trazabilidad y observabilidad en sistemas orientados a eventos utilizando OpenTelemetry.
- Proporcionar experiencia práctica a través de ejercicios de codificación en TypeScript con RabbitMQ.

---

## Agenda (3h)

| Hora | Bloque | Contenido |
|------|--------|-----------|
| 16:00–16:10 | Repaso | Revisión de la sesión anterior y objetivos del día. |
| 16:10–16:40 | Retries con criterio | Backoff/jitter, idempotencia y deduplicación. |
| 16:40–17:10 | DLQ y recuperación | Flujos de redelivery, poison messages y replay. |
| 17:10–17:20 | Descanso | Pausa breve. |
| 17:20–17:50 | Troubleshooting | Diagnóstico: lag, timeouts, saturación y errores. |
| 17:50–18:30 | Observabilidad en mensajería | Métricas, logs correlados y trazabilidad. |
| 18:30–19:00 | Taller | Simular fallos y verificar métricas/logs. |

---

## Aplicado al proyecto del curso (lo que haremos hoy)

Esta sesión es una continuación directa de la sesión 8: ya tenemos el **flujo de eventos** (Outbox/Inbox + RabbitMQ) y hoy lo hacemos **resiliente** y **observable**.

> Si todavía estás en el transporte HTTP (Outbox → `fetch(...)`), primero completa el wiring de la sesión 8 en `project/README.md` y vuelve aquí.

### Wiring 1: Resiliencia (DLX/DLQ + retry con delay)

Objetivo: que los consumidores puedan manejar errores **transitorios** (reintentos con delay/backoff) y aislar errores **permanentes** (DLQ).

Archivos típicos a tocar/crear en `project/`:

- `project/inventory-service/src/infra/messaging/rabbitmq.ts` (topología: exchange/colas, DLX, retry-queues)
- `project/order-fulfillment-service/src/infra/messaging/rabbitmq.ts` (lo mismo para sus colas)
- `project/inventory-service/main.ts` (arrancar consumer(s), `prefetch`, ack/nack)
- `project/order-fulfillment-service/main.ts` (arrancar consumer(s))
- `project/inventory-service/src/config/config.ts` (variables: `RABBITMQ_URL`, `RABBITMQ_EXCHANGE`, `RABBITMQ_DLX`)
- `project/order-fulfillment-service/src/config/config.ts` (variables: `RABBITMQ_URL`, `RABBITMQ_EXCHANGE`, `RABBITMQ_DLX`)

### Wiring 2: Observabilidad (OTel + correlación)

Objetivo: poder responder “¿qué pasó con este mensaje?” con trazas y métricas (por cola, por handler, por error).

Archivos típicos a tocar/crear en `project/`:

- `project/inventory-service/src/infra/observability/otel.ts` (nuevo: SDK + instrumentaciones)
- `project/order-fulfillment-service/src/infra/observability/otel.ts` (nuevo)
- `project/inventory-service/main.ts` (importar OTel lo primero)
- `project/order-fulfillment-service/main.ts` (importar OTel lo primero)
