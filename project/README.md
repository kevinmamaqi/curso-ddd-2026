# Proyecto (final operable) — DDD/Hexagonal + EDA + Observabilidad

Este `project/` corresponde al **estado final** alineado con:

- Día 8: Outbox/Inbox + RabbitMQ
- Día 9: DLQ + retry básico (TTL) + idempotencia
- Día 10: Observabilidad (OTel + Prometheus + Loki + Tempo + Grafana) + cierre

## Qué vas a levantar

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
    GF["Grafana :3000"]
  end

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
  - `inventory.stock-reserved.v1`
  - `inventory.stock-rejected.v1`
- Queues:
  - `inventory.reserve_stock_requested.v1`
  - `fulfillment.inventory_results.v1`
- DLX (direct): `course.dlx.v1` + DLQs por cola

## Arranque (1 comando)

Desde la raíz del repo:

```bash
docker compose -f project/docker-compose.yml up -d --build
```

UIs:

- RabbitMQ: `http://localhost:15672` (`guest` / `guest`)
- Grafana: `http://localhost:3001`
- Prometheus: `http://localhost:9090`

## Probar el flujo end-to-end (con API Gateway)

> Inventory usa UUID como `sku`. Fulfillment acepta UUID o `BOOK-0001` (ver `project/order-fulfillment-service/src/domain/value-objects.ts`).

### 1) Semilla (crear 1 libro con stock)

```bash
psql "postgresql://postgres:postgres@localhost:5432/inventory" -c \
  "INSERT INTO books (id, title, stock) VALUES ('11111111-1111-1111-1111-111111111111', 'DDD Book', 10)
   ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, stock = EXCLUDED.stock;"
```

### 2) Crear pedido (publica `ReserveStockRequested` vía Outbox → RabbitMQ)

```bash
curl -i -X POST http://localhost:8080/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId":"ORDER-000001",
    "reservationId":"RES-000001",
    "lines":[{"lineId":"LINE-0001","sku":"11111111-1111-1111-1111-111111111111","qty":2}]
  }'
```

### 3) Consultar estado (read model)

```bash
curl -i http://localhost:8080/orders/ORDER-000001/status
```

### 4) Consultar inventario (read model)

```bash
curl -i http://localhost:8080/inventory/11111111-1111-1111-1111-111111111111
```

## Qué archivos mirar si algo falla

- Productores (Outbox → exchange):
  - `project/order-fulfillment-service/src/infra/events/OutboxRabbitPublisher.ts`
  - `project/inventory-service/src/infra/events/OutboxRabbitPublisher.ts`
- Consumers (RabbitMQ → Use Case):
  - `project/inventory-service/src/infra/messaging/ReserveStockRequestedRabbitConsumer.ts`
  - `project/order-fulfillment-service/src/infra/messaging/InventoryResultsRabbitConsumer.ts`
- Observabilidad (OTel + /metrics):
  - `project/inventory-service/src/infra/observability/otel.ts`
  - `project/order-fulfillment-service/src/infra/observability/otel.ts`
- API Gateway:
  - `project/api-gateway/main.ts`

