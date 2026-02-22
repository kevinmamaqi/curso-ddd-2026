# Contratos (eventos/comandos) — propuesta mínima

Este documento lista **contratos** (no implementación). Úsalos para fijar *Published Language* y versionado.

## Comandos (intención)

- `PlaceOrder` (Sales/Checkout → Fulfillment)
- `RequestStockReservation` (Fulfillment → Inventory)
- `ConfirmReservation` (Inventory → Fulfillment, vía evento)
- `RejectReservation` (Inventory → Fulfillment, vía evento)
- `ScheduleShipment` (Fulfillment → Shipping, futuro)

## Eventos de dominio (Fulfillment)

- `FulfillmentOrderPlaced`
- `ReservationRequested`
- `ReservationConfirmed`
- `ReservationRejected`
- `FulfillmentOrderReadyToShip`

## Eventos de integración (Published Language)

### `ReserveStockRequested` v1 (Fulfillment → Inventory)

Payload mínimo:

- `reservationId` (string, idempotencia cross-service)
- `lines`: `{ sku, qty }[]`
- `occurredAt` (ISO)

### `StockReserved` v1 (Inventory → Fulfillment)

Payload mínimo:

- `reservationId`
- `sku`
- `qty`
- `occurredAt`

### `StockReservationRejected` v1 (Inventory → Fulfillment)

Payload mínimo:

- `reservationId`
- `sku`
- `reason` (código estable, no “mensaje libre”)
- `occurredAt`

## Notas de versionado

- Versiona por **contrato** (evento de integración), no por “release”.
- Evita payloads gigantes: publica lo necesario para que el downstream tome decisiones.
- Cambios incompatibles ⇒ nuevo tipo o nueva versión (v2), manteniendo v1 durante transición.

## Puntos de integración concretos con este repo

En `project/inventory-service/` verás que hoy la publicación de eventos es minimalista (p.ej. se publica `"reserve"` con payload simple desde `project/inventory-service/src/application/ReserveBookUseCase.ts` usando `project/inventory-service/src/application/ports/BookEventsPublisherPort.ts`).

Para evolucionar hacia *Published Language*:

- centraliza nombres/versiones (evita strings “sueltas” por el código),
- publica payload mínimo estable (`reservationId`, `sku/bookId`, `qty`, `occurredAt`),
- separa **evento de dominio** (interno del agregado) vs **evento de integración** (contrato entre servicios).
