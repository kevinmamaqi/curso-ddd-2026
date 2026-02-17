# Reflexión (ejemplo)

- Elegimos `FulfillmentOrder` como agregado porque concentra invariantes de estado del cumplimiento.
- Inventario se mantiene puro: no conoce el “estado del pedido”, solo stock y reservas.
- Usamos eventos de integración para desacoplar: Fulfillment puede evolucionar su modelo interno sin romper Inventory (y viceversa) si el contrato se mantiene.
- Preferimos ACL en Fulfillment para traducir payloads externos a VOs internos y evitar un “Conformist” por prisa.
- Aceptamos consistencia eventual: el pedido entra en `RESERVATION_PENDING` y se confirma por eventos.
- Próximo paso natural: Outbox/Inbox + retries + DLQ (se verá más adelante con CQRS/EDA).

