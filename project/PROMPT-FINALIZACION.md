# Prompt: Finalización del Proyecto DDD/Hexagonal + EDA

Este documento describe el **objetivo final** del `project/` y sirve como checklist de cierre para el curso.

## Objetivo

Llevar el proyecto `project/` a su **estado final operable**, con:

1. **Código funcional**: flujos EDA (Outbox/Inbox + RabbitMQ), APIs HTTP, dominio correcto
2. **Infraestructura unificada**: Docker Compose con Postgres, RabbitMQ y stack Grafana (Prometheus, Loki, Tempo, Promtail)
3. **Observabilidad**: instrumentación OpenTelemetry, datasources y dashboards mínimos
4. **API Gateway**: servicio público que enruta a inventory-service y order-fulfillment-service

## Estado actual (implementado en `project/`)

Infra unificada:

- `project/docker-compose.yml`
- configs: `project/observability/*`

EDA:

- Publishers:
  - `project/order-fulfillment-service/src/infra/events/OutboxRabbitPublisher.ts`
  - `project/inventory-service/src/infra/events/OutboxRabbitPublisher.ts`
- Consumers:
  - `project/inventory-service/src/infra/messaging/ReserveStockRequestedRabbitConsumer.ts`
  - `project/order-fulfillment-service/src/infra/messaging/InventoryResultsRabbitConsumer.ts`

Observabilidad:

- `project/*/src/infra/observability/otel.ts`
- métricas por servicio (`METRICS_PORT=9464/9465`) + Prometheus scrape en `project/observability/prometheus.yml`
- Grafana provisioning:
  - `project/observability/grafana/provisioning/datasources/datasources.yml`
  - `project/observability/grafana/provisioning/dashboards/dashboards.yml`
  - `project/observability/grafana/dashboards/service-health.json`

API Gateway:

- `project/api-gateway/main.ts` (puerto `8080`)

## Requisitos técnicos (contrato)

### 1) Topología RabbitMQ

- **Exchange**: `course.events.v1` (topic)
- **Routing keys**:
  - `fulfillment.reserve-stock-requested.v1`
  - `inventory.stock-reserved.v1`
  - `inventory.stock-rejected.v1`
- **Queues**:
  - `inventory.reserve_stock_requested.v1` (bind `fulfillment.reserve-stock-requested.v1`)
  - `fulfillment.inventory_results.v1` (bind `inventory.stock-reserved.v1` + `inventory.stock-rejected.v1`)
- **DLX**: `course.dlx.v1` (direct) + DLQ por cola

### 2) EDA (Outbox + RabbitMQ)

- `destination` en outbox = routing key
- Confirm channel + `markSent` tras confirmación
- Consumers con `ack` en OK y `nack(requeue=false)` para DLQ (retry básico por TTL con `x-attempt`)

### 3) Observabilidad

- OTLP traces a Tempo (`OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318`)
- Métricas Prometheus por servicio:
  - `inventory-service`: `:9464/metrics`
  - `order-fulfillment-service`: `:9465/metrics`
- Grafana con datasources (Prometheus/Loki/Tempo) provisionados

### 4) API Gateway

- Servicio Fastify en `:8080`
- Proxy:
  - `POST /orders` → fulfillment
  - `GET /orders/:orderId`, `GET /orders/:orderId/status` → fulfillment
  - `GET /inventory/:sku`, `POST /inventory/:sku/reserve` → inventory
  - `GET /health` → agregado

### 5) Docker Compose unificado

- postgres (dbs: `inventory`, `fulfillment`)
- rabbitmq (+ metrics `15692`)
- prometheus, loki, promtail, tempo, grafana
- api-gateway, inventory-service, order-fulfillment-service

### 6) Estandarización SKU

- Fulfillment acepta UUID como SKU (ver `project/order-fulfillment-service/src/domain/value-objects.ts`).

## Definition of Done (DoD)

- [ ] `docker compose -f project/docker-compose.yml up -d --build` levanta todo
- [ ] POST /orders dispara el flujo end-to-end
- [ ] Métricas accesibles en `:9464/metrics` y `:9465/metrics`
- [ ] Trazas visibles en Grafana (Tempo)
- [ ] RabbitMQ muestra colas + DLQ
- [ ] API Gateway enruta correctamente
- [ ] README guía el arranque y los cURL

