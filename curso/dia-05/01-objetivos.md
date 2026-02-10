# Sesión 5 · Martes 10-feb-2026  
**Duración:** 16:00 – 19:00  
**Tema global:** Patrones Tácticos Avanzados en DDD

**Temario (referencia):**
- [9 · Domain Driven Design (DDD)](../../NUEVO_TEMARIO.md#9-domain-driven-design-ddd)
  - Patrones tácticos
  - Aplicando los distintos patrones a proyectos de Node
- [12 · Patrones de arquitectura en DDD](../../NUEVO_TEMARIO.md#12-patrones-de-arquitectura-en-ddd)
  - Arquitectura por capas
  - Comunicación entre capas
  - Puertos de entrada y salida en la arquitectura hexagonal
  - Tipos de adaptadores en la arquitectura hexagonal
  - Segregación de responsabilidad entre comandos y consultas
  - Scope

## Propósito General

Proporcionar a los participantes una comprensión profunda y aplicable de los patrones tácticos que forman la columna vertebral del diseño de software basado en DDD, con una mirada concreta a su implementación en Node.js. Este módulo se enfoca tanto en la teoría como en su transferencia práctica al código.

Hoy no “empezamos de cero”: vamos a **extender** lo construido en Sesión 3 y 4 en `project/inventory-service/`, y además crearemos un **nuevo servicio complementario** para practicar DDD con más complejidad (context mapping + eventos + consistencia eventual).

---

## Objetivos Específicos

| # | Objetivo                                                        | ¿Por qué importa?                                                                       |
| - | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1 | Comprender el rol de los Aggregate Roots                        | Son la unidad básica de consistencia transaccional y encapsulan invariantes del modelo. |
| 2 | Diferenciar Aggregate Roots de Use Cases                        | Clarifica la separación de responsabilidades entre dominio y aplicación.                |
| 3 | Domain Events para propagar cambios del modelo          | Facilita desacoplamiento, integración y persistencia de eventos relevantes.             |
| 4 | Diseñar y utilizar Value Objects inmutables                     | Aumenta la expresividad del modelo y reduce errores por mutabilidad.                    |
| 5 | Utilizar Domain Services para lógica cruzada entre agregados    | Asegura que la lógica que no pertenece a un agregado tenga un hogar estructurado.       |
| 6 | Conocer Specifications para reglas de negocio reutilizables | Permite encapsular lógica compleja sin contaminar entidades o servicios.                |
| 7 | Identificar y evitar anti-patrones comunes                      | Mejora la mantenibilidad, claridad y coherencia del modelo.                             |
| 8 | Evaluar la calidad de un diseño táctico con un checklist formal | Brinda una guía concreta para revisiones técnicas de diseño.                            |
| 9 | Aprender a construir Aggregates válidos desde una Factory       | Permite aplicar reglas complejas de inicialización sin violar encapsulamiento.          |

---

## Qué construiremos hoy (práctica)

Además de consolidar patrones tácticos, modelaremos un servicio nuevo:

- **Nuevo servicio:** `order-fulfillment-service` (cumplimiento de pedidos).
- **Complemento natural:** consume capacidades de `inventory-service` (reservar / liberar / reponer stock), pero **sin acoplarse** a su modelo interno.
- **Nuevo foco DDD (estratégico + táctico):**
  - definir bounded contexts y su **context map** (upstream/downstream, published language, ACL),
  - diseñar eventos (dominio vs integración) y su versionado,
  - trabajar con **consistencia eventual** (estado de pedido evoluciona por eventos).

> Resultado final esperado (solo referencia para comparar): `local/dia-05/`.

## Resultados Esperados

Al final de la sesión, los estudiantes deberán ser capaces de:

* Explicar con propiedad los elementos centrales del diseño táctico en DDD.
* Identificar cuándo usar cada patrón y por qué.
* Proponer límites (bounded contexts) y mapear integraciones sin acoplamiento directo.
* Implementar un flujo simple con eventos entre servicios (aunque sea con un bus in-memory en el taller).
* Detectar errores estructurales comunes en modelos tácticos y corregirlos.
* Formular mejores decisiones de diseño a partir de una evaluación crítica.

---

## Agenda (3h)

| Hora | Bloque | Contenido |
|------|--------|-----------|
| 16:00–16:10 | Repaso y objetivos | Qué vamos a consolidar hoy. |
| 16:10–16:40 | Aggregates | Invariantes, límites transaccionales y errores típicos. |
| 16:40–17:10 | Domain Events | Semántica, publicación, naming y evolución. |
| 17:10–17:20 | Descanso | Pausa breve. |
| 17:20–17:55 | Servicios, repos y specs | Contratos, composición y anti‑patrones. |
| 17:55–18:35 | Taller | Refactor guiado aplicando patrones al dominio del curso. |
| 18:35–19:00 | Checklist y revisión | Evaluación del diseño, trade-offs y dudas. |
