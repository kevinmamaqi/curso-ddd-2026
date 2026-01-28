# Sesión 4 · Jueves 05-feb-2026  
**Duración:** 16:00 – 19:00  

**Tema global:** Fundamentos de DDD y transición del Modelo Anémico al Modelo Rico

**Temario (referencia):**
- [9 · Domain Driven Design (DDD)](../../NUEVO_TEMARIO.md#9-domain-driven-design-ddd)
  - ¿Qué es DDD?
  - Dominios principales (Core Domain)
  - Subdominios
  - Lenguaje ubicuo (Lenguaje común)
  - Patrones estratégicos
- [14 · Conocimiento y gestión de la complejidad del dominio](../../NUEVO_TEMARIO.md#14-conocimiento-y-gestión-de-la-complejidad-del-dominio)
  - Lenguaje empresarial
  - Modelo del dominio empresarial
  - ¿Qué es un modelo?
  - Modelado efectivo
  - Modelos inconsistentes en la arquitectura hexagonal

---

## Objetivos del día

| # | Objetivo concreto                                                                       | ¿Por qué importa?                                                                                 |
|---|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| 1 | Comprender los pilares estratégicos de DDD: Lenguaje Ubicuo, Subdominios y Bounded Contexts | Permite alinear el diseño del software con la realidad del negocio y evitar ambigüedades semánticas. |
| 2 | Dominar el concepto de Modelo Anémico vs Modelo Rico                                     | Reconocer las limitaciones de un dominio vacío y cómo un modelo rico encapsula reglas e invariantes. |
| 3 | Implementar Value Objects (`Quantity`) y Aggregates (`Order`, `OrderItem`)              | Garantiza inmutabilidad, validación centralizada y coherencia en las entidades de dominio.         |
| 4 | Identificar **Core Domain** y subdominios (soporte/genérico)                              | Permite priorizar inversión donde hay ventaja competitiva y reducir desperdicio.                   |
| 5 | Conectar DDD con el diseño de microservicios (bounded contexts como límites de servicio) | Evita “microservicios por CRUD” y alinea arquitectura con el negocio.                             |

---

## Agenda (3h)

| Hora | Bloque | Contenido |
|------|--------|-----------|
| 16:00–16:10 | Repaso y encuadre | Objetivos del día y contexto del dominio del curso. |
| 16:10–16:40 | Lenguaje ubicuo | Términos, ambigüedad y modelado conversacional. |
| 16:40–17:10 | Subdominios y Core Domain | Dónde invertir esfuerzo de modelado y por qué. |
| 17:10–17:20 | Descanso | Pausa breve. |
| 17:20–18:00 | Bounded Contexts y límites | Context mapping, ownership y límites explícitos. |
| 18:00–18:40 | De anémico a rico | Refactor guiado a Value Objects y Aggregates. |
| 18:40–19:00 | Conexión con el proyecto | Aplicación al dominio del curso (Inventory/Order). |
