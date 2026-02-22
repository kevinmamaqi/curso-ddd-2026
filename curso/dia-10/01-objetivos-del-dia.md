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

## Objetivos y agenda

| Actividad                                | Resultado                        |
|------------------------------------------|----------------------------------|
| **Conceptos clave de Observabilidad**    | Traces, logs y métricas claros   |
| **OpenTelemetry deep-dive**              | Exporter OTLP + exemplars        |
| **Dashboards con Prometheus + Grafana**  | Panel de negocio en vivo         |
| **Documentación (C4 Model + Structurizr)** | Arquitectura comunicable y revisable |
| **Proyecto final evolutivo**             | Servicio operable + checklist de cierre |
| Concept Quiz 10                          | Evaluación                       |

---

## Agenda (3h)

| Hora | Bloque | Contenido |
|------|--------|-----------|
| 16:00–16:10 | Repaso y objetivos | Qué cerramos hoy y cómo medimos “done”. |
| 16:10–16:40 | Observabilidad | Logs, métricas y trazas: modelo mental y señales. |
| 16:40–17:10 | Métricas y dashboards | RED/GOLD, Prometheus y paneles accionables. |
| 17:10–17:20 | Descanso | Pausa breve. |
| 17:20–17:50 | OpenTelemetry | Instrumentación mínima y propagación de contexto. |
| 17:50–18:20 | Estandarización | C4, ADRs, convenciones y Definition of Done. |
| 18:20–19:00 | Cierre del proyecto | Checklist final, revisión y siguientes pasos. |

---

## Aplicado al proyecto del curso (lo que cerramos hoy)

La sesión 9 nos dejó el sistema **resiliente**. Hoy lo dejamos **operable** y **comunicable**:

### Wiring 1 — Telemetría mínima por servicio (trazas + métricas)

Objetivo: poder ver en Grafana/Tempo “qué pasó” con un flujo completo:

`POST /orders` → `ReserveStockRequested` → reserva en Inventory → `StockReserved/Rejected` → actualización de estado del pedido.

Archivos típicos a tocar/crear en `project/`:

- `project/order-fulfillment-service/src/infra/observability/otel.ts` (nuevo: SDK + exporters + instrumentations)
- `project/order-fulfillment-service/main.ts` (inicializar OTel lo primero)
- `project/inventory-service/src/infra/observability/otel.ts` (nuevo)
- `project/inventory-service/main.ts` (inicializar OTel lo primero)

Opcional (si instrumentas RabbitMQ con más detalle):

- `project/order-fulfillment-service/src/infra/messaging/rabbitmq.ts` (añadir spans/attrs al publish/consume)
- `project/inventory-service/src/infra/messaging/rabbitmq.ts`

### Wiring 2 — “Definition of Done” (dashboards + arquitectura)

Objetivo: tener una checklist de cierre con:

- métricas de negocio (`orders_created_total`, `reservations_succeeded_total`, `reservations_failed_total`)
- métricas de operación (errores/retries/DLQ)
- 1 diagrama C4 contenedores + 1 ADR relevante (ej.: RabbitMQ + Outbox/Inbox)

Archivos típicos a tocar/crear:

- `project/artifacts/02-context-map.mmd` (actualizar si el mapa no refleja EDA)
- `project/artifacts/03-integration-contracts.md` (confirmar `type/version/correlationId`)
- `project/artifacts/05-c4.dsl` (nuevo, si quieres Structurizr DSL en el repo)
- `project/artifacts/06-adr-001-eda-transport.md` (nuevo, decisión: broker + outbox/inbox + DLQ)
