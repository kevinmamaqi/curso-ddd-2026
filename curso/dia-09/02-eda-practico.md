# Sesión 9 · EDA práctico: resiliencia y observabilidad con RabbitMQ (sobre el proyecto final)

Hoy nos centramos en la **robustez** y la **observabilidad** del flujo EDA del curso, pero trabajaremos **directamente con el proyecto final** en `project/`:

- Qué hacer cuando un consumidor falla.
- Cómo implementar retries con delay “de verdad” (sin bucles rápidos).
- Cómo aislar poison messages en DLQ.
- Cómo evolucionar contratos/versiones sin romper consumidores.
- Cómo mirar métricas/logs/trazas para explicar un incidente.

---

## Preparación del entorno (10 min)

Desde la raíz del repo:

```bash
docker compose -f project/docker-compose.yml up -d --build
docker compose -f project/docker-compose.yml --profile demo up -d --build
```

URLs útiles:

- RabbitMQ UI: `http://localhost:15672` (`guest`/`guest`)
- Grafana: `http://localhost:3001` (anonymous `Admin`)
- Prometheus: `http://localhost:9090` (targets: `http://localhost:9090/targets`)

Checklist rápido (si “no ves nada” en Grafana):

1) Abre Grafana → dashboard `HTTP Metrics (Course)` y mira el panel **Targets up**.  
2) Si los targets no están `UP`, abre Prometheus `/targets` y revisa qué servicio está caído.  
3) Si los targets están `UP` pero no hay series, asegúrate de que hay tráfico (usa `--profile demo`).

---

## Módulo 1: Manejo de errores, retries y DLQ (RabbitMQ)

En sistemas EDA distinguimos, como mínimo, dos tipos de fallos:

- **Transitorios:** se resuelven reintentando (timeouts, DB momentáneamente no disponible, etc.).
- **Permanentes:** reintentar no cambia el resultado (payload inválido, bug determinista, contrato roto).

**Definiciones rápidas:**

- **DLX (Dead-Letter Exchange):** exchange destino de mensajes “muertos”.
- **DLQ (Dead-Letter Queue):** cola donde terminan esos mensajes.
- **Poison message:** mensaje que falla siempre; debe aislarse.
- **`x-death`:** header que RabbitMQ añade cuando dead-lettera; sirve para diagnosticar “cuántas veces” y “por qué”.

### 1.1 Topología real del proyecto (exchange + DLX + retry-queues)

En el proyecto usamos:

- Exchange (topic): `course.events.v1`
- DLX (direct): `course.dlx.v1`
- Colas principales + DLQs + colas de retry con TTL 10s (delay real, sin plugins).

Dónde está implementado:

- `project/inventory-service/src/infra/messaging/ReserveStockRequestedRabbitConsumer.ts`
- `project/inventory-service/src/infra/messaging/ReleaseReservationRequestedRabbitConsumer.ts`
- `project/order-fulfillment-service/src/infra/messaging/InventoryResultsRabbitConsumer.ts`

### 1.2 Cómo funciona el “retry con delay” (sin plugins)

Patrón usado en los consumidores del proyecto:

1) El consumidor procesa el mensaje.
2) Si falla y todavía quedan reintentos:
   - **ack** del mensaje original (para no bloquear la cola principal),
   - **re-publica** el mismo payload a una **cola de retry** (p.ej. `*.retry.10s`) con `messageTtl=10_000`,
   - añade/incrementa header `x-attempt`.
3) Cuando el mensaje expira en la retry-queue, RabbitMQ lo dead-lettera de vuelta al exchange principal, y el mensaje vuelve a la cola principal para un nuevo intento.
4) Si se agotaron los reintentos: `nack(msg, false, false)` ⇒ DLX ⇒ DLQ.

Esto evita el anti-patrón de `nack(requeue=true)` en bucle rápido (que puede saturar CPU y colas).

### 1.3 Ejercicio guiado A: inspeccionar colas y bindings (UI de RabbitMQ)

En `http://localhost:15672`:

1) Exchanges → abre `course.events.v1`.
2) Queues → localiza:
   - `inventory.reserve_stock_requested.v1`, `inventory.reserve_stock_requested.retry.10s`, `inventory.reserve_stock_requested.dlq`
   - `fulfillment.inventory_results.v1`, `fulfillment.inventory_results.stock_reserved.retry.10s`, `fulfillment.inventory_results.dlq`
3) Verifica que las colas de retry tienen argumentos `message-ttl` y que dead-letteran al exchange principal.

### 1.4 Ejercicio guiado B: forzar retries y DLQ sin tocar código

Objetivo: ver el recorrido **main queue → retry queue → main queue → … → DLQ**.

Forma más determinista (payload inválido):

1) RabbitMQ UI → Exchanges → `course.events.v1` → “Publish message”.
2) Publica un mensaje con:
   - Routing key: `fulfillment.reserve-stock-requested.v1`
   - Payload: `NOT_JSON` (texto plano)
3) Observa en “Queues”:
   - el consumidor fallará al parsear JSON,
   - enviará a `inventory.reserve_stock_requested.retry.10s` con `x-attempt=1`,
   - tras 10s, vuelve a la cola principal,
   - al superar `RABBITMQ_MAX_RETRIES`, terminará en `inventory.reserve_stock_requested.dlq`.

Qué mirar dentro del mensaje:

- Header `x-attempt` (nuestro contador de intentos).
- Header `x-death` (historial de dead-lettering).
- Propiedad `correlationId` (en mensajes reales del sistema suele ser el `reservationId`).

> Tip: si quieres que vaya más rápido a DLQ, baja temporalmente `RABBITMQ_MAX_RETRIES` en `project/docker-compose.yml`.

### 1.5 Idempotencia: por qué existe Inbox en un EDA

En reintentos, redeliveries o replays, el mismo mensaje puede llegar más de una vez. Para evitar “doble efecto”, el proyecto usa **Inbox**:

- `project/inventory-service/src/infra/repository/InboxRepositoryPostgres.ts`
- `project/order-fulfillment-service/src/infra/repository/InboxRepositoryPostgres.ts`

Los handlers hacen:

1) `tryAccept(messageId)` (insert con `ON CONFLICT DO NOTHING`)
2) Si ya se procesó ⇒ se ignora.

---

## Módulo 2: Versionado evolutivo de eventos (sin romper consumidores)

Los eventos evolucionan. Tu objetivo no es “tener v2”, sino poder migrar sin parar el sistema.

Estrategias:

### 2.1 Tolerant Reader

Añadir campos opcionales o ignorar campos desconocidos. Ideal para cambios compatibles.

### 2.2 Up-caster

Cuando hay cambios estructurales, conviertes v1 → v2 **antes** de ejecutar tu caso de uso.

En el proyecto, el shape mínimo ya incluye `version`:

- Contratos Inventory: `project/inventory-service/src/infra/integration/contracts.ts`
- Mensajería de integración en Fulfillment: `project/order-fulfillment-service/src/domain/events.ts`
- Notas/guía de contratos: `project/__docs/03-integration-contracts.md`

Pipeline recomendado en consumidores:

```ts
const raw = JSON.parse(msg.content.toString());
const message = upcastIntegrationMessage(raw);
await useCase.execute(message);
```

### 2.3 Streams paralelos (v1 y v2 conviviendo)

Para cambios incompatibles grandes, publica en nuevas routing keys/colas y migra consumidores gradualmente.

---

## Módulo 3: Observabilidad (métricas + logs + trazas) aplicada a EDA

Objetivo: responder “¿qué pasó?” con evidencia:

- **Métricas (Prometheus):** rate, errores, latencia, colas.
- **Logs (Loki):** diagnóstico puntual con contexto.
- **Trazas (Tempo + OTel):** ver el camino y tiempos de un flujo distribuido.

Dónde está en el proyecto:

- OTel SDK + exportación:
  - `project/inventory-service/src/infra/observability/otel.ts`
  - `project/order-fulfillment-service/src/infra/observability/otel.ts`
  - `project/api-gateway/src/infra/observability/otel.ts`
- Dashboard listo en Grafana:
  - `project/observability/grafana/dashboards/http-metrics.json`

### Qué mirar en Grafana

En `http://localhost:3001`:

- Dashboards:
  - `HTTP Metrics (Course)` (home)
  - `Service Health (Course)`
- Explore → Loki:
  - `{service="inventory-service"}`
  - `{service="order-fulfillment-service"}`
- Explore → Tempo:
  - filtra por `service.name=api-gateway`, `service.name=inventory-service`, `service.name=order-fulfillment-service`

---

## Cierre

Al terminar la sesión deberías poder:

1) Explicar (y ver) cómo un mensaje pasa por **retry con TTL** y cuándo termina en **DLQ**.  
2) Justificar por qué **Inbox** es obligatorio para idempotencia en EDA.  
3) Usar Grafana/Prometheus/RabbitMQ UI para diagnosticar por qué un flujo “se queda pendiente”.  

