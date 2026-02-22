# Sesión 10 · Jueves 26-feb-2026  
## Repaso exprés de la Sesión 9

1. Gestión de errores en EDA: DLX/DLQ, poison messages y estrategias de retry (incluyendo el patrón de *retry-queue con TTL*).
2. Idempotencia y deduplicación: por qué asumimos **at-least-once** y cómo `Inbox` evita efectos duplicados.
3. Versionado y evolución de eventos: *Tolerant Reader* y *Upcasters* para consumir `v1`/`v2` sin romper el sistema.
4. RabbitMQ en Node.js: exchanges, colas, bindings, `ack`/`nack`, `prefetch` y dónde instrumentar (bordes).

---

## Continuidad con el proyecto del curso

Llegamos a una arquitectura con:

- `order-fulfillment-service` publicando `ReserveStockRequested` (Outbox) y consumiendo resultados (Inbox).
- `inventory-service` consumiendo `ReserveStockRequested` (Inbox), reservando stock y publicando `StockReserved` / `StockReservationRejected` (Outbox).

En esta sesión (día 10) el foco es **operación**: observabilidad end‑to‑end + dashboards accionables + documentación de arquitectura (C4/ADRs) para poder revisar el proyecto con una Definition of Done clara.
