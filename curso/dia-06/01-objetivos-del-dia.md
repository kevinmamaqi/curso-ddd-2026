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

## Agenda (3h)

| Hora | Bloque | Contenido |
|------|--------|-----------|
| 16:00–16:10 | Repaso y foco | Qué problema queremos resolver con CQRS. |
| 16:10–16:35 | Problemas de escalado | Señales, cuellos de botella y límites del CRUD. |
| 16:35–17:05 | CQRS fundamentals | Commands, queries, handlers y contratos. |
| 17:05–17:15 | Descanso | Pausa breve. |
| 17:15–17:45 | Proyecciones y lectura | Read models, caché y estrategias de rendimiento. |
| 17:45–18:20 | Otras estrategias | Réplicas, balanceo, jobs y control de tráfico. |
| 18:20–19:00 | Taller | Diseñar una separación read/write y su proyección mínima. |
