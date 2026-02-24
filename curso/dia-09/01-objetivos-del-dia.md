# Sesión 9 · Martes 24-feb-2026  
**Duración:** 16:00 – 19:00  
**Tema global:** *Resiliencia + troubleshooting + observabilidad en EDA (RabbitMQ + OTel)*

**Temario (referencia):**
- [5 · Tolerancia a fallos y resiliencia en microservicios](../../NUEVO_TEMARIO.md#5-tolerancia-a-fallos-y-resiliencia-en-microservicios)
  - Manejo de fallas y errores en microservicios
  - Estrategias de recuperación y reintentos en microservicios
  - Pruebas de resiliencia y recuperación en microservicios
  - Diseño de sistemas anti-fragiles en microservicios
- [7 · Monitorización y solución de problemas en microservicios](../../NUEVO_TEMARIO.md#7-monitorización-y-solución-de-problemas-en-microservicios)
  - Uso de herramientas de monitorización y registro de logs
  - Análisis y solución de problemas en microservicios
  - Detección y prevención de fallas en microservicios
  - Monitoreo y control de métricas en entornos de microservicios
- [13 · Patrones de comunicación en DDD](../../NUEVO_TEMARIO.md#13-patrones-de-comunicación-en-ddd)
  - Traducción de modelos con estado
  - Bandeja de salida
  - Gestión de procesos

## Objetivos y agenda

- Consolidar un flujo EDA con RabbitMQ **robusto** (reintentos con delay + DLQ) y **observable** (métricas, logs, trazas).
- Practicar troubleshooting respondiendo preguntas típicas:
  - “¿Qué mensaje está fallando y por qué?”
  - “¿Está reintentando o se fue a DLQ?”
  - “¿Qué parte del flujo tiene más latencia?”
- Reforzar versionado evolutivo de eventos (tolerant reader + up-casters + streams paralelos) usando los contratos del proyecto.

---

## Agenda (3h)

| Hora | Bloque | Contenido |
|------|--------|-----------|
| 16:00–16:10 | Arranque | Levantar `project/` + checklist de observabilidad. |
| 16:10–16:40 | Retries con criterio | Retry con TTL (delay real) + límites + backoff básico. |
| 16:40–17:10 | DLQ y recuperación | Poison messages, `x-death`, replay controlado (DLQ → exchange). |
| 17:10–17:20 | Descanso | Pausa breve. |
| 17:20–17:50 | Troubleshooting | Qué mirar en RabbitMQ/Prometheus/Grafana cuando “no avanza”. |
| 17:50–18:30 | Observabilidad | Métricas (HTTP + colas), logs con labels, trazas con OTel. |
| 18:30–19:00 | Taller | Forzar fallos y verificar: retry → DLQ + dashboards. |

---

## Aplicado al proyecto del curso (lo que haremos hoy)

Hoy trabajamos **directo** con el proyecto final en `project/` (sin ejercicios “sueltos”): el objetivo es que sepas **dónde está** cada patrón en el código y **cómo usarlo** para operar el sistema.

### 0) Arranque + verificación rápida

```bash
docker compose -f project/docker-compose.yml up -d --build
docker compose -f project/docker-compose.yml --profile demo up -d --build
```

Checklist:

- RabbitMQ UI `http://localhost:15672` → colas creadas y creciendo/bajando.
- Prometheus `http://localhost:9090/targets` → targets `UP`.
- Grafana `http://localhost:3001` → dashboard `HTTP Metrics (Course)` con series.

### 1) Resiliencia (DLX/DLQ + retry con delay real)

Objetivo: que los consumidores manejen errores **transitorios** (retry con delay) y aíslen errores **permanentes** (DLQ), sin bloquear el flujo.

Dónde está en el proyecto:

- Topología base (exchange + DLX):  
  - `project/inventory-service/src/infra/messaging/rabbitmq.ts`  
  - `project/order-fulfillment-service/src/infra/messaging/rabbitmq.ts`
- Consumidores con retry-queue (TTL 10s) + DLQ:
  - `project/inventory-service/src/infra/messaging/ReserveStockRequestedRabbitConsumer.ts`
  - `project/inventory-service/src/infra/messaging/ReleaseReservationRequestedRabbitConsumer.ts`
  - `project/order-fulfillment-service/src/infra/messaging/InventoryResultsRabbitConsumer.ts`
- Prefetch y arranque de consumidores:
  - `project/inventory-service/main.ts`
  - `project/order-fulfillment-service/main.ts`
- Config (variables RabbitMQ + límite de retries):
  - `project/inventory-service/src/config/config.ts`
  - `project/order-fulfillment-service/src/config/config.ts`

Qué mirar en RabbitMQ:

- Colas principales vs colas de retry (`*.retry.10s`) vs DLQ (`*.dlq`).
- Headers `x-attempt` (nuestro contador) y `x-death` (historial de dead-lettering).

Ejercicios guiados recomendados:

- Fallo permanente (payload inválido) → retry → DLQ.
- Fallo transitorio (DB down corto) → retry → recuperación.
- Recuperación de DLQ (replay controlado) → verificación por logs/métricas.

### 2) Idempotencia (Inbox)

Objetivo: que un redelivery o un replay no duplique efectos.

Dónde está:

- `project/inventory-service/src/infra/repository/InboxRepositoryPostgres.ts`
- `project/order-fulfillment-service/src/infra/repository/InboxRepositoryPostgres.ts`

### 3) Observabilidad (OTel + métricas + logs)

Objetivo: poder explicar “qué pasó” con datos (no con suposiciones).

Dónde está:

- OTel (trazas a Tempo + /metrics vía Prometheus exporter):
  - `project/inventory-service/src/infra/observability/otel.ts`
  - `project/order-fulfillment-service/src/infra/observability/otel.ts`
  - `project/api-gateway/src/infra/observability/otel.ts`
- Métricas HTTP (contadores + latencia) para que haya paneles útiles en Grafana:
  - `project/api-gateway/src/infra/observability/httpMetrics.ts`
  - `project/inventory-service/src/infra/observability/httpMetrics.ts`
  - `project/order-fulfillment-service/src/infra/observability/httpMetrics.ts`
- Grafana provisioning + dashboards:
  - `project/observability/grafana/provisioning/`
  - `project/observability/grafana/dashboards/`
