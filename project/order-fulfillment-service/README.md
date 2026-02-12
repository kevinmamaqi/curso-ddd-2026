# Business description — `order-fulfillment-service`

Imagina una empresa de e‑commerce (catálogo grande, varios almacenes) que ya tiene un `inventory-service` para gestionar stock. Hoy el procesamiento de pedidos vive en un backend monolítico y sufre durante picos de tráfico: al crear un pedido, el sistema consulta stock y “reserva” mediante llamadas directas y sincronizadas, con lógica duplicada y errores de concurrencia. Los **Warehouse Operators** reciben listas de picking impresas sin priorización ni “rutas”; los **Sales Analysts** lanzan promociones sin visibilidad real de capacidad; y el **Customer Support** no puede explicar con precisión por qué un pedido está “atascado” (faltan estados intermedios y trazabilidad).

Durante flash sales, el monolito sobrevende: la reserva no es idempotente, los reintentos crean duplicidades y, cuando un ítem se queda sin stock, se cancela todo el pedido manualmente. Además, el equipo de logística integra con **Logistics Partners** (transportistas) con llamadas “a pelo”, generando inconsistencias: un envío se agenda antes de confirmar reservas, o se agenda dos veces por reintentos. El negocio necesita **visibilidad** y **desacoplamiento**: que el flujo de cumplimiento funcione con consistencia eventual, con eventos claros, y que cada área pueda evolucionar su modelo sin romper a las demás.

Propuesta: crear un nuevo servicio **`order-fulfillment-service`** que gestione el flujo de cumplimiento: recepción/validación del pedido, **solicitud de reserva** (a Inventario), confirmación o rechazo de reservas, generación de “pick list” y coordinación de agenda de envíos. Este servicio debe integrarse con `inventory-service` mediante **contratos explícitos** (API y/o eventos) y, cuando el lenguaje difiera, usar una **Anti‑Corruption Layer** para traducir modelos. El éxito del servicio no se mide solo por “funciona”, sino por la **claridad del modelo**, la trazabilidad de estados y la resiliencia a reintentos.

## Descripción Formal

### Actores

- Warehouse Operators
- Customer Support
- Sales Analysts
- Logistics Partners (transportistas)

### Capacidades (responsabilidades)

- Representar el estado del cumplimiento (pedido/líneas).
- Solicitar reservas a Inventario (por API/eventos).
- Confirmar/rechazar reservas y aplicar transiciones del dominio.
- Generar información de picking/packing (a nivel de modelo, no UI).
- Programar envíos (vía integración con logística, fuera de scope hoy).

### Lenguaje ubicuo (términos clave)

- Fulfillment Order, Line, Reservation (estado), ReadyToShip, PickList, Shipment

### Contratos explícitos

- Con Inventory Service (upstream): mediante API.
- Con Shipping (externos): API/eventos, preferiblemente eventos.

## Detalles técnicos

### Comandos (intención/acciones)

- `PlaceOrder`: Ventas -> Fulfillment.
- `RequestStockReservation` (Fulfillment → Inventory)
- `ConfirmReservation` (Inventory → Fulfillment, vía evento)
- `RejectReservation` (Inventory → Fulfillment, vía evento)
- `ScheduleShipment` (Fulfillment → Shipping, futuro)

### Eventos de dominio

- `FulfillmentOrderPlaced`
- `ReservationRequested`
- `ReservationConfirmed`
- `ReservationRejected`
- `FulfillmentOrderReadyToShip`

### Eventos de integración

- `ReserveStockRequested`

Payload mínimo debería de tener:

```json
{
  "reservationId": string,
  "items": [
    {
      "itemId": "456",
      "quantity": 1
    }
  ],
  "ocurredAt": string
}
```

- `StockReserved`

Payload mínimo debería de tener:

```json
{
  "reservationId": string,
  "ocurredAt": string
}
```

- `StockReservationRejected`

Payload mínimo debería de tener:

```json
{
  "reservationId": string,
  "ocurredAt": string
}
```

- Todos los eventos deberían de tener un versionado. Sirve para el contrato.