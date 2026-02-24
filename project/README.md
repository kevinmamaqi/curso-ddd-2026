# Proyecto (final operable) — DDD/Hexagonal + EDA + Observabilidad

Este `project/` corresponde al **estado final** alineado con:

- Día 8: Outbox/Inbox + RabbitMQ
- Día 9: DLQ + retry básico (TTL) + idempotencia
- Día 10: Observabilidad (OTel + Prometheus + Loki + Tempo + Grafana) + cierre

## Qué vas a levantar (topología)

```mermaid
flowchart LR
  G["api-gateway :8080"] --> F["order-fulfillment-service :3002"]
  G --> I["inventory-service :3000"]

  F --> PG[(Postgres)]
  I --> PG

  F --> MQ["RabbitMQ (course.events.v1)"]
  I --> MQ

  subgraph Obs["Grafana Stack"]
    P["Prometheus :9090"]
    L["Loki :3100"]
    T["Tempo :3200 / OTLP :4318"]
    GF["Grafana :3001"]
  end

  G -. metrics .-> P
  G -. traces .-> T
  F -. metrics .-> P
  I -. metrics .-> P
  F -. traces .-> T
  I -. traces .-> T
  P --> GF
  L --> GF
  T --> GF
```

### Topología RabbitMQ (mínimo viable)

- Exchange (topic): `course.events.v1`
- Routing keys:
  - `fulfillment.reserve-stock-requested.v1`
  - `fulfillment.release-reservation-requested.v1`
  - `inventory.stock-reserved.v1`
  - `inventory.stock-rejected.v1`
- Queues:
  - `inventory.reserve_stock_requested.v1`
  - `inventory.release_reservation_requested.v1`
  - `fulfillment.inventory_results.v1`
- DLX (direct): `course.dlx.v1` + DLQs por cola

## Día 9/10 — Arranque rápido (con datos + tráfico)

Desde la raíz del repo:

```bash
docker compose -f project/docker-compose.yml up -d --build
```

Si es la primera vez que levantas el proyecto, Postgres se inicializa con datos semilla.
Si ya lo levantaste antes y quieres volver a un estado “limpio” (re-ejecutar seeds):

```bash
docker compose -f project/docker-compose.yml down -v
docker compose -f project/docker-compose.yml up -d --build
```

Para **generar tráfico automático** (recomendado en Día 9/10 para ver logs/trazas/métricas sin hacer cURL manual):

```bash
docker compose -f project/docker-compose.yml --profile demo up -d --build
```

Para parar solo el tráfico:

```bash
docker compose -f project/docker-compose.yml --profile demo stop demo-traffic
```

### URLs (copy/paste)

UIs:

- RabbitMQ: `http://localhost:15672` (`guest` / `guest`)
- Grafana: `http://localhost:3001` (anonymous `Admin`)
- Prometheus: `http://localhost:9090` (targets: `http://localhost:9090/targets`)
- Loki (API): `http://localhost:3100`
- Tempo (API): `http://localhost:3200`

Servicios:

- API Gateway: `http://localhost:8080`
- Inventory (HTTP): `http://localhost:3000`
- Fulfillment (HTTP): `http://localhost:3002`

Observabilidad (endpoints):

- API Gateway metrics: `http://localhost:9466/metrics`
- Inventory metrics: `http://localhost:9464/metrics`
- Fulfillment metrics: `http://localhost:9465/metrics`

## Endpoints HTTP (todas las “rutas del proyecto”)

### API Gateway (`http://localhost:8080`)

- Health:
  - `GET http://localhost:8080/health`
- Orders (BFF):
  - `POST http://localhost:8080/orders`
  - (nota) `GET http://localhost:8080/orders` **NO existe** → Fastify responde `404 Route GET:/orders not found`
  - `GET  http://localhost:8080/orders/:orderId`
  - `GET  http://localhost:8080/orders/:orderId/status`
  - `GET  http://localhost:8080/orders/:orderId/pick-list`
  - `POST http://localhost:8080/orders/:orderId/cancel`
- Inventory (BFF):
  - `GET  http://localhost:8080/inventory/:sku`
  - `POST http://localhost:8080/inventory/:sku/reserve`
  - `POST http://localhost:8080/inventory/:sku/replenish`
  - `POST http://localhost:8080/inventory/:sku/release`

#### Nota: `GET /orders` (sin `:orderId`) devuelve 404

El Gateway **no implementa** listado de pedidos (`GET /orders`). Si lo llamas por error:

```bash
curl -i http://localhost:8080/orders
```

Respuesta esperada:

```json
{
  "message": "Route GET:/orders not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### Inventory Service (`http://localhost:3000`)

- `GET  http://localhost:3000/health`
- `GET  http://localhost:3000/ready`
- `GET  http://localhost:3000/inventory/:sku`
- `GET  http://localhost:3000/inventory?onlyAvailable=true`
- `GET  http://localhost:3000/inventory?sku=:sku`
- `POST http://localhost:3000/inventory/:sku/reserve`
- `POST http://localhost:3000/inventory/:sku/replenish`
- `POST http://localhost:3000/inventory/:sku/release`
- `GET  http://localhost:3000/inventory/reservations/:reservationId`
- (solo para ejercicios) `POST http://localhost:3000/integration/reserve-stock-requested`

### Order Fulfillment Service (`http://localhost:3002`)

- `GET  http://localhost:3002/health`
- `POST http://localhost:3002/orders`
- `GET  http://localhost:3002/orders/:orderId`
- `GET  http://localhost:3002/orders/:orderId/status`
- `GET  http://localhost:3002/orders/:orderId/pick-list`
- `POST http://localhost:3002/orders/:orderId/cancel`
- `POST http://localhost:3002/orders/:orderId/ready-to-ship`
- `GET  http://localhost:3002/orders?status=PENDING`
- (solo para ejercicios) `POST http://localhost:3002/integration/inventory-events`

## gRPC (opcional, comunicación interna)

Puertos:

- Inventory gRPC: `localhost:50051`
- Fulfillment gRPC: `localhost:50052`

Ejemplo con `grpcurl` (si lo tienes instalado):

- `grpcurl -plaintext localhost:50051 course.inventory.v1.InventoryService/GetStock '{"sku":"11111111-1111-1111-1111-111111111111"}'`
- `grpcurl -plaintext localhost:50052 course.fulfillment.v1.FulfillmentService/GetOrder '{"orderId":"ORDER-..."}'`

## Probar el flujo end-to-end (manual, con API Gateway)

> Inventory usa UUID como `sku`. (Se siembra automáticamente al levantar Postgres: `1111...`, `2222...`, `3333...`).

### 1) Crear pedido (publica `ReserveStockRequested` vía Outbox → RabbitMQ)

```bash
curl -i -X POST http://localhost:8080/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId":"ORDER-000001",
    "reservationId":"RES-000001",
    "lines":[{"lineId":"LINE-0001","sku":"11111111-1111-1111-1111-111111111111","qty":2}]
  }'
```

### 2) Consultar estado (read model)

```bash
curl -i http://localhost:8080/orders/ORDER-000001/status
```

### 3) Consultar inventario (read model)

```bash
curl -i http://localhost:8080/inventory/11111111-1111-1111-1111-111111111111
```

### 4) Cancelar (publica `ReleaseReservationRequested` → Inventory libera reservas)

```bash
curl -i -X POST http://localhost:8080/orders/ORDER-000001/cancel
```

## Qué archivos mirar si algo falla

- Productores (Outbox → exchange):
  - `project/order-fulfillment-service/src/infra/events/OutboxRabbitPublisher.ts`
  - `project/inventory-service/src/infra/events/OutboxRabbitPublisher.ts`
- Consumers (RabbitMQ → Use Case):
  - `project/inventory-service/src/infra/messaging/ReserveStockRequestedRabbitConsumer.ts`
  - `project/inventory-service/src/infra/messaging/ReleaseReservationRequestedRabbitConsumer.ts`
  - `project/order-fulfillment-service/src/infra/messaging/InventoryResultsRabbitConsumer.ts`
- Observabilidad (OTel + /metrics):
  - `project/inventory-service/src/infra/observability/otel.ts`
  - `project/order-fulfillment-service/src/infra/observability/otel.ts`
- API Gateway:
  - `project/api-gateway/main.ts`

## Grafana / Loki / Tempo (Día 10)

En Grafana `http://localhost:3001`:

- Dashboards:
  - `HTTP Metrics (Course)` (home)
  - `Service Health (Course)`
- Explore → Loki:
  - `{service="inventory-service"}`
  - `{service="order-fulfillment-service"}`
- Explore → Tempo:
  - filtra por `service.name=api-gateway`, `service.name=inventory-service` o `service.name=order-fulfillment-service`
