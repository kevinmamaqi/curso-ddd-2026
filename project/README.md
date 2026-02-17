# Día 7 — Starter

Este directorio es el **punto de partida** para la sesión 7 (3 horas).  
Tu objetivo es llevar este `project/` al estado final de la sesión 7, que está en:

- `.local/dia-07-referencia/`

No copies/pegues: implementa los cambios aplicando los patrones vistos hoy.

## Dónde estamos (inicio día 7)

- `inventory-service/` ya tiene CQRS incremental (read model `inventory_view`).
- `order-fulfillment-service/` ya puede crear órdenes y pedir reserva de stock (hoy lo hace de forma síncrona vía HTTP).

## Objetivo del día 7

- Reemplazar la integración síncrona por un flujo distribuido robusto:
  - `order-fulfillment-service` publica `ReserveStockRequested` usando **Outbox**.
  - `inventory-service` consume, reserva, y publica `StockReserved` / `StockReservationRejected` (también con Outbox).
  - `order-fulfillment-service` consume resultados con **idempotencia** y proyecta un read model `order_status_view`.

Los contratos están en `artifacts/03-integration-contracts.md`.

## Checklist (orden sugerido)

1. Outbox + publisher (polling) en `order-fulfillment-service`.
2. Endpoint de integración en `inventory-service` para recibir `ReserveStockRequested`.
3. Outbox + publisher (polling) en `inventory-service` para publicar resultados a fulfillment.
4. Inbox + consumer en `order-fulfillment-service` para aplicar confirm/reject (usando ACL).
5. Proyección `order_status_view` + query `GET /orders/:orderId/status`.

## Guía de implementación (sin solución copiada)

Usa esta guía como “ruta”. El objetivo es que tú escribas el código, no que lo pegues.

### Paso A — `order-fulfillment-service`: Outbox para `ReserveStockRequested`

1. Crea persistencia Postgres + Unit of Work
   - Necesitarás un cliente PG (y una forma simple de transacciones).
   - La meta: poder hacer **en una misma TX**: `save(order)` + `enqueue(outboxMessage)`.
2. Implementa Outbox
   - Tabla `order_outbox_messages` con `id`, `destination`, `body`, `created_at`, `sent_at`.
   - Repo con `enqueue(...)`, `getUnsent(...)`, `markSent(...)`.
3. Cambia el publisher de eventos de integración
   - En vez de “console log”, el publisher debe **encolar** en Outbox.
4. Implementa el “worker” (polling)
   - Loop periódico que lee `getUnsent()` y hace `POST` al destino.
   - Si falla, no marques como enviado (se reintenta en el siguiente tick).
5. Actualiza `PlaceOrderUseCase`
   - Debe dejar de llamar directo a inventory de forma síncrona.
   - Debe persistir la orden y publicar `ReserveStockRequested` vía outbox.

### Paso B — `inventory-service`: consumir `ReserveStockRequested` con Inbox + publicar resultados con Outbox

1. Crea endpoint de integración
   - `POST /integration/reserve-stock-requested`
2. Añade Inbox (idempotencia)
   - Tabla `inventory_inbox_messages` y repo `tryAccept(messageId)` (dedupe).
3. Caso de uso consumidor
   - Para cada `{ sku, qty }`: ejecuta el command existente (`ReserveBookUseCase` / `ReserveInventoryUseCase`).
   - Publica resultado por línea: `StockReserved` o `StockReservationRejected`.
4. Añade Outbox + worker (polling)
   - Igual idea que en fulfillment, pero publicando hacia fulfillment.

### Paso C — `order-fulfillment-service`: consumir resultados + proyección `order_status_view`

1. Endpoint de integración
   - `POST /integration/inventory-events`
2. Inbox (idempotencia)
   - Tabla `order_inbox_messages` y `tryAccept(messageId)`.
3. Traducción (ACL)
   - Usa `src/application/acl-inventory-translator.ts` para mapear `sku -> lineId`.
   - Para esto, normalmente necesitas persistir el “routing” (por ejemplo: `reservationId -> lineBySku`).
4. Aplica el resultado en el agregado y proyecta
   - `confirmLineReservation(...)` / `rejectLineReservation(...)`
   - Proyección a `order_status_view` (read model) y endpoint `GET /orders/:orderId/status`.
