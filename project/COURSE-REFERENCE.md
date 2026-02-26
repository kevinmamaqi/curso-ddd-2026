# Course Reference (DDD/Hex/CQRS/EDA) — aplicado a `project/`

Este documento es un “mapa” rápido: **qué principio del curso aplica**, **por qué**, y **dónde verlo** en este repo para reutilizarlo en tu proyecto.

## 1) DDD (Domain-Driven Design)

**Por qué aplica:** reduce complejidad separando el *core* (reglas) de lo accidental (frameworks/DB/broker). Te permite hablar en lenguaje ubicuo y proteger invariantes.

**Dónde verlo:**

- Dominio puro (invariantes, transiciones, VOs):
  - `project/inventory-service/src/domain/`
  - `project/order-fulfillment-service/src/domain/`
- Errores de dominio (para mapearlos luego a HTTP o DLQ):
  - `project/inventory-service/src/domain/errors.ts`
  - `project/order-fulfillment-service/src/domain/*`

**Regla práctica:** entidades/VOs **no** dependen de Fastify, Postgres, RabbitMQ ni OpenTelemetry.

## 2) Hexagonal (Ports & Adapters)

**Por qué aplica:** el dominio y la aplicación no deben “conocer” infraestructura. Cambiar RabbitMQ por otro broker o Postgres por otro storage no debería romper tu core.

**Dónde verlo:**

- Use cases (aplicación) coordinan reglas + puertos:
  - `project/order-fulfillment-service/src/application/place-order-use-case.ts`
  - `project/inventory-service/src/application/ReserveBookUseCase.ts`
- Puertos (interfaces) y wiring con DI:
  - `project/order-fulfillment-service/src/application/ports.ts`
  - `project/inventory-service/src/application/ports/*`
  - `project/*/main.ts` (composition root)
- Adaptadores:
  - HTTP: `project/*/src/infra/http/*`
  - Postgres: `project/*/src/infra/repository/*`
  - RabbitMQ: `project/*/src/infra/messaging/*`
  - Outbox publisher: `project/*/src/infra/events/OutboxRabbitPublisher.ts`

**Regla práctica:** instrumentación (logs/métricas/trazas) va en los **bordes** (adaptadores), no dentro del dominio.

## 3) CQRS (Command/Query Responsibility Segregation)

**Por qué aplica:** en sistemas EDA, la escritura y la lectura suelen tener ritmos distintos. CQRS te deja:

- escribir con consistencia e invariantes (commands), y
- leer rápido desde proyecciones/read-models (queries) con consistencia eventual.

**Dónde verlo:**

- Queries/read model en Fulfillment:
  - `project/order-fulfillment-service/src/application/GetOrderStatusQuery.ts`
  - `project/order-fulfillment-service/src/application/GetPickListQuery.ts`
  - `project/order-fulfillment-service/src/application/OrderStatusProjector.ts`
- Repositorios de vistas:
  - `project/order-fulfillment-service/src/infra/repository/OrderStatusViewRepositoryPostgres.ts`

**Regla práctica:** cuando respondas `202 Accepted` en un comando, el alumno debe esperar “convergencia” y mirar el estado con una query.

## 4) EDA (Event-Driven Architecture) + Outbox/Inbox + DLQ

**Por qué aplica:** entre servicios asumimos **at-least-once**. Eso exige:

- publicación fiable (Outbox) cuando dependes de una TX de DB
- deduplicación idempotente (Inbox) en consumidores
- retries para fallos transitorios
- DLQ para fallos permanentes (*poison messages*)

**Dónde verlo:**

- Outbox/Inbox repos:
  - `project/order-fulfillment-service/src/infra/repository/OutboxRepositoryPostgres.ts`
  - `project/order-fulfillment-service/src/infra/repository/InboxRepositoryPostgres.ts`
  - `project/inventory-service/src/infra/repository/*`
- Consumers (retry → DLQ):
  - `project/inventory-service/src/infra/messaging/ReserveStockRequestedRabbitConsumer.ts`
  - `project/order-fulfillment-service/src/infra/messaging/InventoryResultsRabbitConsumer.ts`
- ADR (decisión) del transporte:
  - `project/__docs/06-adr-001-eda-transport.md`

**Regla práctica:** si algo “no funciona”, **primero** mira colas/DLQ y el header `x-death` en RabbitMQ UI.

## 5) Observabilidad (operabilidad del sistema)

**Por qué aplica:** sin logs+métricas+trazas, el sistema EDA es una “caja negra” y no puedes explicar “qué pasó”.

**Dónde verlo:**

- Stack local (todo en uno):
  - `project/docker-compose.yml`
- OTEL por servicio:
  - `project/*/src/infra/observability/otel.ts`
- Métricas HTTP:
  - `project/*/src/infra/observability/httpMetrics.ts`
- Métricas EDA (código: consumers/outbox):
  - `project/*/src/infra/observability/messagingMetrics.ts`
- KPI de negocio (ejemplo):
  - `project/order-fulfillment-service/src/infra/observability/businessMetrics.ts` (`orders_placed_total`)

**Regla práctica:** usa siempre `x-correlation-id` en requests; en este repo se usa como `reqId` y se añade como atributo `correlation_id` en los spans.

## 6) “Definition of Done” (para tu proyecto)

Si copias este patrón a tu proyecto, considera “Done” cuando puedas demostrar:

- **E2E**: `POST /orders` → evento → consumo → estado convergente
- **Idempotencia**: re-delivery no duplica efectos (Inbox)
- **Resiliencia**: retry para transitorios y DLQ para permanentes
- **Observabilidad**: puedes seguir 1 flujo con `x-correlation-id` en Loki + Tempo + métricas
- **Docs-as-code**: al menos 1 ADR + 1 C4 contenedores

Documentación del proyecto en este repo:

- `project/README.md` (runbook + E2E)
- `project/__docs/` (context map, contratos, ADRs, C4)
