# Avance del proyecto · Sesión 5

## Qué haremos hasta la sesión 6 (Jueves 12-feb-2026)

Continuaremos con el proyecto de sesiones anteriores, reforzando DDD táctico y preparando el terreno para CQRS.

### Objetivos

- Completar los casos de uso principales (crear, reservar, liberar, reponer).
- Reforzar el Aggregate Root con invariantes explícitas (no “validaciones sueltas” en controllers).
- Introducir/afinar eventos de dominio (nombres en pasado, payload mínimo, versionado).
- Añadir tests unitarios del dominio y tests de integración para adaptadores críticos.
- Dejar preparado el modelo de eventos para crear proyecciones en la sesión 6 (CQRS).

### Extra (recomendado): preparar la integración con `order-fulfillment-service`

Si has avanzado con el taller de hoy (`curso/dia-05/04-taller-order-fulfillment.md`), deja **semi‑listo** el contrato entre contextos:

- Define 2–3 **eventos de integración** estables (p.ej. `StockReserved`, `StockReservationRejected`).
- Decide relación de context mapping:
  - `Inventory` como *upstream* con **Published Language** (eventos),
  - `Fulfillment` como *downstream* con **ACL** para traducir.
- En `inventory-service`, intenta que la publicación de eventos no sea “string suelto”:
  - tipa el evento (al menos `name`, `version`, `occurredAt`, `payload`)
  - centraliza nombres/versiones (evita duplicarlos por el proyecto)
