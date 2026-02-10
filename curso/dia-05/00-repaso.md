# Sesión 5 · Martes 10-feb-2026  
## Repaso exprés de la Sesión 4

| Tema | Recuerda | Pregunta guía |
|------|----------|---------------|
| Lenguaje Ubicuo | Mismo término en código, tests y negocio. | ¿Qué término del dominio del curso es más ambiguo hoy y cómo lo fijarías? |
| Subdominios | Core vs Soporte vs Genérico. | ¿Qué parte del flujo aporta ventaja competitiva y cuál es soporte? |
| Modelo Rico | VO inmutables, invariantes en Aggregate Root. | ¿Qué invariante debería vivir dentro del agregado y no en un controller? |

---

## Continuidad (Sesión 3 → 4): qué construimos en `inventory-service`

En las sesiones 3 y 4 aplicamos arquitectura hexagonal + DDD táctico sobre el **contexto de Inventario**. La idea era clara: *“prometer stock”* mediante reservas, evitando sobreventa y duplicidad.

En el repo, ese trabajo vive en `project/inventory-service/`:

- **Value Objects** (semántica + validación): `project/inventory-service/src/domain/va/BookId.ts`, `project/inventory-service/src/domain/va/Quantity.ts`, `project/inventory-service/src/domain/va/ReservationId.ts`
- **Agregado/Entidad principal** (reglas del dominio): `project/inventory-service/src/domain/entities/BookStock.ts`
- **Use Case** (orquestación): `project/inventory-service/src/application/ReserveBookUseCase.ts`
- **Puertos** (DIP): `project/inventory-service/src/application/ports/BookRepositoryPort.ts`, `project/inventory-service/src/application/ports/BookEventsPublisherPort.ts`
- **Adaptadores** (infra): `project/inventory-service/src/infra/http/bookStockRouter.ts`, `project/inventory-service/src/infra/repository/BookRepositoryPostgres.ts`

Pregunta puente (hoy): si `inventory-service` sabe “reservar stock”, ¿qué servicio debería **consumir esa capacidad** sin acoplarse a su modelo interno?

Taller guiado de hoy: `curso/dia-05/04-taller-order-fulfillment.md`.
