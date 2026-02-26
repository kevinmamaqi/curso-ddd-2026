# Sesión 10 · Jueves 26-feb-2026  
**Duración:** 16:00 – 19:00
**Tema global:** *Monitorización, estandarización y cierre del proyecto final*

**Temario (referencia):**
- [7 · Monitorización y solución de problemas en microservicios](../../NUEVO_TEMARIO.md#7-monitorización-y-solución-de-problemas-en-microservicios)
  - Optimización y mejora continua en entornos de microservicios
  - Implementación de sistemas de descubrimiento y registro de servicios
  - Gestión de configuraciones y variables de entorno en microservicios
  - Escalado automático y orquestación de contenedores en microservicios
  - Estrategias de respaldo y recuperación en entornos de microservicios
- [15 · Estandarización de desarrollos, conclusiones y revisión de proyectos del curso](../../NUEVO_TEMARIO.md#15-estandarización-de-desarrollos-conclusiones-y-revisión-de-proyectos-del-curso)
  - Introducción al concepto de estandarización de desarrollos
  - Estrategias principales para estandarizar desarrollos entre equipos
  - Principales herramientas
  - Uso de métricas
  - Revisando proyectos del curso y su estandarización
- [16 · Proyecto final evolutivo](../../NUEVO_TEMARIO.md#16-proyecto-final-evolutivo)
  - Estableciendo los requisitos del proyecto
  - Estableciendo la arquitectura
  - Orientando a microservicios
  - Orientando a Arquitactura Hexagonal
  - Garantizando eficiencia a través de CQRS
  - Desarrollando la solución
  - Redacción de pruebas
  - Análisis de resultados
  - Consejos y buenas prácticas para siguientes pasos

## Objetivos

| Actividad                                | Resultado                        |
|------------------------------------------|----------------------------------|
| **Conceptos clave de Observabilidad**    | Traces, logs y métricas claros   |
| **OpenTelemetry deep-dive**              | Exporter OTLP + exemplars        |
| **Dashboards con Prometheus + Grafana**  | Panel de negocio en vivo         |
| **Documentación (C4 Model + Structurizr)** | Arquitectura comunicable y revisable |
| **Proyecto final evolutivo**             | Servicio operable + checklist de cierre |
| Concept Quiz 10                          | Evaluación                       |

---

## Aplicado al proyecto del curso (lo que cerramos hoy)

El objetivo del día anterior era dejar el sistema **resiliente**. Hoy lo dejamos **operable** y **comunicable**:

### Wiring 1 — Telemetría mínima por servicio (trazas + métricas)

Objetivo: poder ver en Grafana/Tempo “qué pasó” con un flujo completo:

`POST /orders` → `ReserveStockRequested` → reserva en Inventory → `StockReserved/Rejected` → actualización de estado del pedido.

En este repo **ya está implementado**. Puntos de entrada para ver “dónde vive”:

- OTEL SDK por servicio:
  - `project/api-gateway/src/infra/observability/otel.ts`
  - `project/inventory-service/src/infra/observability/otel.ts`
  - `project/order-fulfillment-service/src/infra/observability/otel.ts`
- Métricas:
  - HTTP: `project/*/src/infra/observability/httpMetrics.ts`
  - EDA (Outbox/Consumers): `project/*/src/infra/observability/messagingMetrics.ts`
- Stack de observabilidad (Grafana/Prometheus/Loki/Tempo): `project/docker-compose.yml` + `project/observability/*`

Opcional (si instrumentas RabbitMQ con más detalle):

- `project/order-fulfillment-service/src/infra/messaging/rabbitmq.ts` (añadir spans/attrs al publish/consume)
- `project/inventory-service/src/infra/messaging/rabbitmq.ts`

### Wiring 2 — “Definition of Done” (dashboards + arquitectura)

Objetivo: tener una checklist de cierre con:

- 1–3 métricas de negocio (ej.: `orders_placed_total`, `reservations_total`)
- métricas de operación (errores/retries/DLQ)
- 1 diagrama C4 contenedores + 1 ADR relevante (ej.: RabbitMQ + Outbox/Inbox)

Dónde está la documentación “docs-as-code” del proyecto:

- `project/__docs/02-context-map.mmd`
- `project/__docs/03-integration-contracts.md`
- (opcional) `project/__docs/05-c4.dsl`
- (opcional) `project/__docs/06-adr-001-eda-transport.md`
