# Sesión 1 · Martes 27-ene-2026  
**Duración:** 16:00 – 19:00  
**Tema global:** *Introdu- cción a la Arquitectura de Microservicios (y cómo encaja DDD/Hexagonal/CQRS/EDA)*

**Temario (referencia):**
- [1 · Introducción a la arquitectura de microservicios](../../NUEVO_TEMARIO.md#1-introducción-a-la-arquitectura-de-microservicios)
  - ¿Qué es la arquitectura de microservicios?
  - Principios y características de los microservicios
  - Ventajas y desafíos de los microservicios
  - Comparación con otras arquitecturas (monolítica, SOA, etc.)
  - Aplicaciones y casos de uso de la arquitectura de microservicios
  - Definición de límites de dominio y contexto del negocio
  - Separación de responsabilidades y funcionalidades en microservicios
  - Modelado y diseño de interfaces de comunicación
  - Técnicas de descomposición y partición de servicios
  - Estrategias de escalabilidad y disponibilidad en microservicios
- [2 · Implementación de microservicios](../../NUEVO_TEMARIO.md#2-implementación-de-microservicios)
  - Selección de tecnologías y lenguajes de programación
  - Configuración y despliegue de infraestructura para microservicios
  - Gestión de dependencias y versionado de microservicios
  - Implementación de comunicación entre microservicios (síncrona y asíncrona)
  - Técnicas de monitoreo y gestión de microservicios
- [3 · Comunicación y descubrimiento de servicios](../../NUEVO_TEMARIO.md#3-comunicación-y-descubrimiento-de-servicios)
  - Protocolos y formatos de intercambio de datos en microservicios
  - Implementación de APIs y contratos de servicio
  - Uso de herramientas de descubrimiento y registro de servicios
  - Patrones de comunicación entre microservicios (síncrona y asíncrona)
  - Gestión de errores y fallas en la comunicación
- [8 · Migración a microservicios](../../NUEVO_TEMARIO.md#8-migración-a-microservicios)
  - Evaluación de arquitecturas existentes para migración a microservicios
  - Identificación de servicios y funcionalidades candidatos a migrar
  - Estrategias de migración gradual y paralela
  - Gestión de datos y bases de datos en entornos de microservicios
  - Retos y consideraciones en la migración a microservicios

---

## Objetivos del día

| # | Objetivo específico | Relevancia |
|---|---------------------|------------|
| 1 | Definir qué es la **arquitectura de microservicios** y sus principios principales. | Establece un lenguaje común para todo el curso y evita “microservicios” como etiqueta vacía. |
| 2 | Comparar microservicios frente a monolito y SOA, identificando ventajas, riesgos y cuándo no aplicarlos. | Permite decisiones arquitectónicas equilibradas (evita sobre-ingeniería). |
| 3 | Delimitar **límites de dominio** (bounded contexts) y proponer una primera descomposición de servicios. | Sin límites claros, la comunicación y el ownership se degradan desde el día 1. |
| 4 | Identificar estrategias base de escalabilidad/disponibilidad (sync/async, caché, resiliencia) que condicionan el diseño. | Conecta diseño de servicios con performance y tolerancia a fallos. |
| 5 | Clonar el repositorio y ejecutar la pila base del proyecto (`docker compose`) en local. | Asegura un entorno reproducible para las sesiones prácticas. |

---

## Conceptos evaluados

- ¿Qué es la arquitectura de microservicios? Principios y características.
- Ventajas/desafíos y comparativa con monolito/SOA.
- Límites de dominio: contexto, ownership y primeras heurísticas de descomposición.
- Interfaces y contratos: qué decide un API y qué decide un evento.
- Panorama de escalabilidad/disponibilidad: caché, balanceo, asincronía y resiliencia.
- Arranque del entorno del proyecto (Docker Compose) y verificación de servicios.

*(La respuesta a cada punto deberá poder expresarse en menos de 30 segundos.)*

---

## Relación con el Proyecto Evolutivo

En esta primera sesión se valida el entorno de desarrollo y se ejecuta la base sin modificar el código. Este punto de partida común permitirá construir, de forma incremental, la solución final a lo largo del curso.

---

## Requisitos técnicos

- Docker ≥ 24 y Docker Compose v2  
- Node.js 20 LTS + **npm 10**  
- Visual Studio Code con extensiones ESLint, Prettier y Docker  
- Al menos **3 GB** de RAM libre para contenedores (PostgreSQL, RabbitMQ y dos servicios)

---

## Bibliografía y recursos recomendados

### Artículos y blogs

| Tema | Enlace |
|------|--------|
| Arquitectura Hexagonal | <https://alistair.cockburn.us/hexagonal-architecture/> |
| DDD en la práctica | <https://martinfowler.com/tags/domain%20driven%20design.html> |
| CQRS en microservicios | <https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs> |
| EDA y resiliencia | <https://martinfowler.com/articles/201701-event-driven.html> |

### Documentación oficial

- **OpenTelemetry:** <https://opentelemetry.io/docs/instrumentation/js/>  
- **RabbitMQ Tutorials:** <https://www.rabbitmq.com/getstarted.html>  
- **Prisma ORM:** <https://www.prisma.io/docs/>

### Libros

1. **“Domain-Driven Design Distilled”** – Vaughn Vernon  
2. **“Patterns of Enterprise Application Architecture”** – Martin Fowler  
3. **“Learning Event-Driven Architecture”** – Hugh McKee  
4. **“Clean Architecture”** – Robert C. Martin (referencia comparativa)
