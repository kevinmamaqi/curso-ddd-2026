# Sesión 6 · Jueves 12-feb-2026
**Duración:** 16:00 – 19:00
**Tema global:** *Escalabilidad y rendimiento: CQRS (separación comando/consulta) aplicado a microservicios*

**Temario (referencia):**
- [4 · Escalabilidad y rendimiento en microservicios](../../NUEVO_TEMARIO.md#4-escalabilidad-y-rendimiento-en-microservicios)
  - ¿Cómo detectar problemas de escalado?
  - Introducción a las técnicas de escalado más habituales
  - Estrategias de escalabilidad horizontal y vertical
  - Uso de patrón CQRS
  - Uso de Base de Datos de Replicación
  - Implementación de caché en microservicios
  - Técnicas de optimización de rendimiento en microservicios
  - Monitoreo y ajuste de recursos en entornos de microservicios

## Objetivos del día

Venimos de una sesión centrada en **DDD táctico** y en diseñar integraciones entre contextos (Inventario ↔ Fulfillment) apoyadas en **eventos**. Hoy usaremos ese mismo dominio como base para introducir **CQRS** de forma incremental: mantener un **write model** con reglas (agregado) y empezar a construir **read models** optimizados para consulta.

Durante esta sesión profundizaremos en los fundamentos y en la implementación práctica del patrón CQRS (Command Query Responsibility Segregation) dentro de un entorno Node.js. Se pretende que los participantes no solo comprendan el modelo conceptual detrás de la separación entre comandos y consultas, sino que además sean capaces de aplicarlo de forma estructurada en un contexto realista.

### Objetivos de aprendizaje

* Comprender la motivación detrás del uso de CQRS, reconociendo los límites de los modelos CRUD tradicionales.
* Identificar claramente las diferencias semánticas y técnicas entre comandos (acciones que cambian el estado) y queries (acciones que lo consultan).
* Entender cómo estructurar un proyecto que aplica CQRS en Node.js utilizando handlers, buses y validaciones.
* Construir un flujo completo de comando con validación, persistencia del cambio y proyección asociada.
* Revisar y solidificar conceptos mediante un quiz técnico al final de la sesión.

Al finalizar la clase, los participantes deberán sentirse cómodos creando comandos, handlers y proyecciones simples, además de poder evaluar cuándo tiene sentido aplicar CQRS en un sistema determinado.

> “No es solo separar lectura y escritura: es entender cuándo, cómo y por qué hacerlo.”

---
