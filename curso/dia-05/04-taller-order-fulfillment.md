# Taller (Sesión 5) — Modelado + implementación de `order-fulfillment-service`

Objetivo: llevar DDD “avanzado” a práctica realista, **sin abandonar** el patrón que ya tenemos en `project/inventory-service/` (VOs → agregado → use case → puertos → adaptadores), pero añadiendo:

- **Context Mapping** (relaciones entre contextos),
- **Eventos de integración** (contratos entre servicios),
- **ACL** (traducción de modelos),
- **Consistencia eventual** (estados que se confirman por eventos).

> Resultado final esperado (referencia): `local/dia-05/`.

---

## 1) Continuidad: lo que ya hicimos en `inventory-service` (día 3 y 4)

Antes de crear un nuevo servicio, repasamos (en código) el patrón base:

- VOs: `project/inventory-service/src/domain/va/BookId.ts`, `project/inventory-service/src/domain/va/Quantity.ts`, `project/inventory-service/src/domain/va/ReservationId.ts`
- Use case: `project/inventory-service/src/application/ReserveBookUseCase.ts`
- Puertos: `project/inventory-service/src/application/ports/BookRepositoryPort.ts`, `project/inventory-service/src/application/ports/BookEventsPublisherPort.ts`
- Adaptadores: `project/inventory-service/src/infra/http/bookStockRouter.ts`, `project/inventory-service/src/infra/repository/BookRepositoryPostgres.ts`

**Pregunta guía:** hoy no vamos a “meter pedidos” dentro de inventario. Vamos a crear un nuevo bounded context que **orquesta** un flujo más grande: *cumplir pedidos*.

**Checkpoint 0 (5 min)**  
Escribe 3 frases que definan el límite del contexto Inventario:

- “Inventario decide si se puede reservar stock”.
- “Inventario no decide rutas de picking, ni envíos, ni estados del pedido al cliente”.
- “Inventario publica hechos del stock (eventos) para que otros contextos reaccionen”.

---

## 2) Nuevo servicio: descripción de negocio (2–3 párrafos)

Imagina una empresa de e‑commerce (catálogo grande, varios almacenes) que ya tiene un `inventory-service` para gestionar stock. Hoy el procesamiento de pedidos vive en un backend monolítico y sufre durante picos de tráfico: al crear un pedido, el sistema consulta stock y “reserva” mediante llamadas directas y sincronizadas, con lógica duplicada y errores de concurrencia. Los **trabajadores de logística (warehouse operator)** reciben listas de picking impresas sin priorización ni “rutas”; los **analistas de ventas (sales analyst)** lanzan promociones sin visibilidad real de capacidad; y el **soporte al cliente (customer support)** no puede explicar con precisión por qué un pedido está “atascado” (faltan estados intermedios y trazabilidad).

Durante flash sales, el monolito sobrevende: la reserva no es idempotente, los reintentos crean duplicidades y, cuando un ítem se queda sin stock, se cancela todo el pedido manualmente. Además, el equipo de logística integra con **partners de logística (logistics partners)** con llamadas “a pelo”, generando inconsistencias: un envío se agenda antes de confirmar reservas, o se agenda dos veces por reintentos. El negocio necesita **visibilidad** y **desacoplamiento**: que el flujo de cumplimiento funcione con consistencia eventual, con eventos claros, y que cada área pueda evolucionar su modelo sin romper a las demás.

Propuesta: crear un nuevo servicio **`order-fulfillment-service`** que gestione el flujo de cumplimiento: recepción/validación del pedido, **solicitud de reserva** (a Inventario), confirmación o rechazo de reservas, generación de “pick list” y coordinación de agenda de envíos. Este servicio debe integrarse con `inventory-service` mediante **contratos explícitos** (API y/o eventos) y, cuando el lenguaje difiera, usar una **Anti‑Corruption Layer** para traducir modelos. El éxito del servicio no se mide solo por “funciona”, sino por la **claridad del modelo**, la trazabilidad de estados y la resiliencia a reintentos.

---

## 3) Análisis guiado (lenguaje → necesidades → límites)

### 3.1 Extrae lenguaje ubicuo

Fijarse en la narrativa:

- **Sustantivos** (candidatos a conceptos): Pedido, Línea, Reserva, ...
- **Verbos** (candidatos a comandos/métodos): Colocar pedido, Solicitar reserva, Confirmar reserva, Rechazar reserva, ...
- **Adjetivos/reglas** (candidatos a invariantes): idempotente, ...

**Checkpoint 1 (10 min)**  
Escribe un mini‑glosario (8–12 términos) y define 2 términos que **cambian de significado** según el contexto. Ejemplo:

- “Reserva” en Inventario = bloqueo temporal de stock por `reservationId`.
- “Reserva” en Fulfillment = estado del pedido/línea (“pendiente”, “confirmada”, “rechazada”).

### 3.2 Propón bounded contexts (y justifica fronteras)

Propuesta inicial (puedes cambiarla):

- **Inventory** (ya existe): stock, reservas, reposición.
- **Fulfillment** (nuevo): estados del cumplimiento, coordinación, pick/pack, integración con inventario y logística.
- **Shipping/Carrier Integration** (externo o futuro): agenda de envíos, tracking, etiquetas.

Heurísticas para justificar límites:

- **Invariantes**: ¿qué reglas necesitan consistencia fuerte dentro de una transacción?
- **Ritmo de cambio**: ¿qué cambia junto? (promociones vs logística vs stock).
- **Lenguaje**: ¿dónde “Pedido” significa otra cosa?

**Checkpoint 2 (10 min)**  
Dibuja un contexto map rápido (cajas + flechas). Marca:

- upstream/downstream,
- tipo de relación (Customer/Supplier, Published Language, ACL, Conformist),
- “qué contrato” cruza el límite (API vs evento).

---

## 4) Modelado táctico (agregados, entidades, VOs, eventos)

### 4.1 Identifica el agregado principal de Fulfillment

Una opción razonable:

- **Aggregate Root:** `FulfillmentOrder`
- **Entidad interna:** `FulfillmentOrderLine` (líneas del pedido)
- **VOs:** `OrderId`, `LineId`, `Sku` (o `BookId` como “item id”), `Quantity`, `Address`

Invariantes típicas (elige 3–5 para implementar hoy):

- Un pedido no puede pasar a `READY_TO_SHIP` si hay líneas sin reserva confirmada.
- Una línea no puede tener `Quantity <= 0`.
- `OrderId` es estable y único (idempotencia: mismo `orderId` + misma intención ⇒ no duplicar).
- Un evento de “reserva confirmada” no puede aplicarse dos veces a la misma línea.

### 4.2 Eventos (dominio vs integración)

Regla práctica:

- **Evento de dominio**: expresa un hecho *dentro* del bounded context (vive “cerca” del agregado).
- **Evento de integración**: es un contrato entre contextos (payload estable, versionado, published language).

Ejemplo (nombres en pasado):

- Dominio (Fulfillment): `FulfillmentOrderPlaced`, `ReservationRequested`, `ReservationConfirmed`, `ReservationRejected`, `ShipmentScheduled`
- Integración (hacia/desde Inventory): `ReserveStockRequested`, `StockReserved`, `StockReservationRejected`

**Checkpoint 3 (10 min)**  
Escribe una lista de:

- 5 comandos (intención del usuario/sistema),
- 5 eventos (hechos del dominio),
- 3 eventos de integración (contratos entre servicios).

---

## 5) Implementación paso a paso (paralela a `inventory-service`, pero más profunda)

> Aquí la meta no es “terminar un producto”, sino **producir un modelo coherente** y un flujo que resista reintentos.

### 5.1 Estructura sugerida del nuevo servicio (hexagonal)

Crea `project/order-fulfillment-service/` con una estructura similar a `project/inventory-service/`:

- `src/domain/` (VOs, agregado, eventos de dominio)
- `src/application/` (use cases, puertos, handlers)
- `src/infra/` (HTTP, repo in-memory, adaptador de eventos, ACL hacia inventario)

### 5.2 Tarea A — VOs (10–15 min)

Implementa (o copia el patrón de `inventory-service/src/domain/va/`):

- `OrderId` (formato estable; p.ej. `ORDER-000001`)
- `Sku` (o `BookId` con otro nombre si quieres separar lenguaje)
- `Quantity`

Hecho cuando: las validaciones de significado están en el dominio, no en routers.

### 5.3 Tarea B — Agregado `FulfillmentOrder` + eventos (25–35 min)

Implementa métodos con intención:

- `place(...)`
- `requestReservation(...)`
- `confirmReservation(...)`
- `rejectReservation(...)`
- `markReadyToShip(...)`

Registra eventos dentro del agregado y expón `pullDomainEvents()` (igual que practicamos en sesión 4).

Hecho cuando: un test unitario demuestra una transición válida y una inválida.

### 5.4 Tarea C — Use cases + puertos (25–35 min)

Use cases mínimos:

- `PlaceOrderUseCase` (crea pedido + emite eventos; guarda)
- `RequestStockReservationUseCase` (coordina llamada/emit a Inventario)
- `HandleStockReservedUseCase` (aplica confirmación al agregado)

Puertos recomendados:

- `FulfillmentOrderRepositoryPort` (persistencia)
- `InventoryReservationsPort` (ACL: “lo que Fulfillment necesita de Inventario”)
- `IntegrationEventPublisherPort` (publicar contratos hacia fuera)

Hecho cuando: el use case no importa nada de HTTP/DB/broker.

### 5.5 Tarea D — ACL + contratos (20–30 min)

Define cómo se integra con `inventory-service`:

- Opción 1 (**sync**): Fulfillment llama a Inventario por HTTP para reservar.
- Opción 2 (**async**): Fulfillment publica `ReserveStockRequested` y escucha `StockReserved`.

Para el taller, puedes simular un broker con un bus in-memory, pero el **contrato** debe ser explícito:

- nombre del evento,
- versión,
- payload mínimo.

La ACL traduce:

- tipos externos → VOs internos,
- naming (p.ej. `bookId` → `sku`),
- errores externos → decisiones internas.

Hecho cuando: puedes cambiar el payload externo sin tocar el agregado (solo la ACL).

---

## 6) Entrega del día (qué debes tener al final)

- Un contexto map (aunque sea en Mermaid) mostrando relación `Fulfillment ↔ Inventory`.
- Un agregado con 3–5 invariantes implementadas + tests.
- Eventos de dominio en pasado + una propuesta de eventos de integración versionados.
- Un use case orquestando (dominio + puertos) y un adaptador simple.
- Reflexión de 8–12 líneas: trade-offs, decisiones y qué dejarías para una siguiente iteración.

> Comparación: revisa `local/dia-05/` para ver un “resultado esperado” (solo referencia).

