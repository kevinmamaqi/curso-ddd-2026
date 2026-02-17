# Sesión 7 · Martes 17-feb-2026  
**Duración:** 16:00 – 19:00
**Tema global:** *CQRS avanzado + patrones de comunicación (Outbox, Saga, Process Manager) y resiliencia*

> En este día veremos como se conenctan dos servicios distintos usando **eventos** de forma robusta usando **Outbox + idempotencia**.

**Temario (referencia):**
- [4 · Escalabilidad y rendimiento en microservicios](../../NUEVO_TEMARIO.md#4-escalabilidad-y-rendimiento-en-microservicios)
  - Uso de Lambdas para demandas de uso no continuas
  - Uso de balanceadores de carga en microservicios
  - Aplicando técnicas de escalado en proyectos Node
- [5 · Tolerancia a fallos y resiliencia en microservicios](../../NUEVO_TEMARIO.md#5-tolerancia-a-fallos-y-resiliencia-en-microservicios)
  - Implementación de circuit breakers y fallbacks
  - Manejo de fallas y errores en microservicios
  - Estrategias de recuperación y reintentos en microservicios
  - Pruebas de resiliencia y recuperación en microservicios
  - Diseño de sistemas anti-fragiles en microservicios
- [13 · Patrones de comunicación en DDD](../../NUEVO_TEMARIO.md#13-patrones-de-comunicación-en-ddd)
  - Traducción de modelos sin estado
  - Traducción de modelos con estado
  - Bandeja de salida
  - Saga
  - Gestión de procesos

## Objetivos y roadmap de la sesión

- Sincronizar sprint: PR de ayer revisados  
- Traducción de modelos (sin estado / con estado)  
- **Patrón Outbox + Exactly-Once**: Diseño sin fantasías  
- **Saga/Process Manager** intro: Choreography vs Orchestration  
- Lab: Saga de checkout (reserva → creación) + compensaciones  
- Concept Quiz 07: Validación del aprendizaje  

### Metas de código

1. Persistir eventos de integración `ReserveStockRequested` y `StockReserved`/`StockReservationRejected`.  
2. Outbox funcionando con idempotencia/deduplicación.  
3. Proyección `order_status_view` actualizada a partir del flujo distribuido.  

*Dejar listo para la sesión 8 (EDA).*  

---

## Agenda (3h)

| Hora | Bloque | Contenido |
|------|--------|-----------|
| 16:00–16:10 | Repaso y sincronización | Revisión de PRs y acuerdos de diseño. |
| 16:10–16:40 | Traducción de modelos | Stateless vs stateful translation, ACL y correlación. |
| 16:40–17:10 | Outbox Pattern | Persistencia fiable, deduplicación e idempotencia. |
| 17:10–17:20 | Descanso | Pausa breve. |
| 17:20–17:50 | Sagas / Process Managers | Orquestación vs coreografía y compensaciones. |
| 17:50–18:20 | Resiliencia | Retries, timeouts, DLQ y circuit breaker (criterio práctico). |
| 18:20–19:00 | Taller | Conectar flujo de checkout con eventos + outbox. |
