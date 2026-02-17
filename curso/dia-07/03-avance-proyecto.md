# Avance del proyecto · Sesión 7 — Sprint (Outbox + procesos distribuidos)

**Objetivo hasta la sesión 8 (EDA)**

- Completar un flujo distribuido entre `order-service` e `inventory-service` usando eventos.
- Publicación fiable de eventos con Outbox (sin “fantasías” de exactly-once).
- Observabilidad mínima del flujo: métricas y un dashboard básico en Grafana.

---

## Alcance del sprint (flujo objetivo)

Coreografía recomendada:

1. `order-fulfillment-service` crea una orden (estado `RESERVATION_PENDING`) y publica `ReserveStockRequested` (v1) en su **Outbox**.
2. `inventory-service` consume `ReserveStockRequested`, intenta reservar stock y publica (por línea):
   - `StockReserved` (v1), o
   - `StockReservationRejected` (v1).
3. `order-fulfillment-service` consume el resultado y transiciona el estado de la orden (por confirmación/rechazo de líneas), actualizando la proyección `order_status_view`.

> Alternativa (orquestada): implementar el Process Manager en `order-api` y mantener el estado del proceso allí.

---

## Tareas clave

| # | Componente | Entregable | Done? |
|---|------------|------------|-------|
| 1 | order-fulfillment-service | Outbox table + publisher (polling) para `ReserveStockRequested` | |
| 2 | inventory-service | Consumer `ReserveStockRequested` + publicación de resultado | |
| 3 | order-fulfillment-service | Consumer de inventario + transición de estado + proyección `order_status_view` | |
| 4 | Observabilidad | Métricas del flujo (`outbox_*`, `process_*`) + panel básico | |

### Checklist de calidad

- Idempotencia por `messageId`/`correlationId` en consumidores.
- Retries con backoff y DLQ para fallos permanentes.
- Contratos versionados (mínimo: `type`, `version`, `timestamp`, `payload`).

> Deadline: Miércoles 18-feb-2026 23:59.  
> **Demo live del flujo** abre la sesión 8 (EDA).
