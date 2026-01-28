# Sesión 3 · Martes 03-feb-2026  
**Duración:** 16:00 – 19:00
**Tema global:** *Límites de dominio (bounded contexts), ownership y cómo se reflejan en el diseño del servicio*

**Temario (referencia):**
- [1 · Introducción a la arquitectura de microservicios](../../NUEVO_TEMARIO.md#1-introducción-a-la-arquitectura-de-microservicios)
  - Definición de límites de dominio y contexto del negocio
  - Separación de responsabilidades y funcionalidades en microservicios
  - Técnicas de descomposición y partición de servicios
- [3 · Comunicación y descubrimiento de servicios](../../NUEVO_TEMARIO.md#3-comunicación-y-descubrimiento-de-servicios)
  - Implementación de APIs y contratos de servicio
  - Patrones de comunicación entre microservicios (síncrona y asíncrona)
  - Gestión de errores y fallas en la comunicación
- [14 · Conocimiento y gestión de la complejidad del dominio](../../NUEVO_TEMARIO.md#14-conocimiento-y-gestión-de-la-complejidad-del-dominio)
  - Problemas de negocio
  - Descubrimiento del conocimiento
  - Comunicación
  - ¿Qué es el lenguaje ubicuo?
  - ¿Qué es un contexto delimitado?
  - Subdominios
  - Límites
  - Límites físicos
  - Límites de propiedad

## Objetivos del día

| # | Objetivo concreto                                                  | ¿Por qué importa?                                                            |
|---|--------------------------------------------------------------------|-------------------------------------------------------------------------------|
| 1 | Consolidar la base hexagonal (puertos/adaptadores) sin contaminar el dominio | Evita que el servicio derive en un “mini‑monolito”. |
| 2 | Definir **límites de dominio** del inventario (qué pertenece y qué no) | Los límites correctos reducen acoplamiento, fricción y duplicidades. |
| 3 | Identificar **subdominios** y ownership (límites físicos/de propiedad) | Alinea el diseño con la organización y con el ritmo de cambio. |
| 4 | Diseñar contratos iniciales de integración (API/eventos) y manejo de errores | Reduce fallos en comunicación y facilita evolución del sistema. |
| 5 | Avanzar el `inventory-service` con DIP + tests (dominio/aplicación) | Mantiene una base testeable y lista para integrar con otros servicios. |

---

## Agenda (3h)

| Hora | Bloque | Contenido |
|------|--------|-----------|
| 16:00–16:10 | Repaso y foco del día | Qué consolidamos y qué evitamos. |
| 16:10–16:45 | Límites de dominio | Bounded contexts, subdominios, ownership y límites físicos. |
| 16:45–17:15 | Contratos de integración | API vs eventos, manejo de errores y evolución del contrato. |
| 17:15–17:25 | Descanso | Pausa breve. |
| 17:25–18:05 | Testing por capas | Unit/integration, puertos, adapters y estrategia mínima. |
| 18:05–18:50 | Taller: inventory-service | Implementar un caso de uso con tests y adapter real. |
| 18:50–19:00 | Cierre | Quiz rápido y próximos pasos. |

## Relación con el Proyecto Final

El foco de hoy es aplicar lo aprendido sobre arquitectura hexagonal para desarrollar un `inventory-service` bien estructurado, preparando su dominio e infraestructura para futuras integraciones y eventos.

---

## Requisitos antes de empezar

- Código de la Sesión 2 clonado en local
- Comprensión de Ports & Adapters y DI con Awilix  
- VS Code sin errores de ESLint ni TypeScript  

Con estos cimientos, entramos en la Sesión 3 enfocados en reforzar el aprendizaje anterior y avanzar con un servicio concreto. ¡A por ello!
