## 1. Repaso de la Sesión 1

Antes de adentrarnos en Arquitectura Hexagonal, repasemos los conceptos clave que cubrimos en la **Sesión 1**, su importancia y un pequeño reto práctico para afianzar cada uno.

> Hoy practicaremos primero con un mini‑dominio “similar” al proyecto (reservas de stock), pero **no** tocaremos `project/` hasta el final. Crearemos durante la sesión un mini‑workspace en `curso/dia-02/ejercicios` (TypeScript + Fastify + Vitest, igual que el stack del repo).

| Concepto | Descripción resumida | Micro-challenge |
|----------|-----------------------|-----------------|
| **Microservicios** | Servicios autónomos alineados a capacidades de negocio, con contratos explícitos y operación distribuida. | Elige una capacidad (Pedidos/Inventario/Pagos) y escribe 3 responsabilidades que **sí** y 3 que **no** deben vivir en ese servicio. |
| **Límites de dominio (bounded context)** | Delimitar modelos y ownership para reducir acoplamiento y conflictos semánticos. | Lista 5 términos del negocio; marca cuáles cambian de significado según el contexto (p. ej. “pedido” en logística vs facturación). |
| **Contratos (API vs eventos)** | Decidir cuándo usar comunicación síncrona y cuándo eventos para desacoplar. | Para un flujo de “checkout”: ¿qué iría por API y qué por evento? Justifica en 2 líneas. |
| **DDD (táctico)** | Modelar reglas con **Entities** y **Value Objects** (invariantes) para que el dominio sea explícito. | En el mini‑dominio: define 2 invariantes para `BookId` y `Quantity`. ¿Dónde deben vivir (HTTP vs dominio) y por qué? |
| **CQRS (separación comando/consulta)** | Diferenciar operaciones que **cambian estado** vs **leen estado** para simplificar modelos y contratos. | Clasifica estos endpoints: `POST /book-stock/:bookId/reserve`, `POST /book-stock`, `GET /book-stock/:bookId`. ¿Qué devuelve cada uno y por qué? |
| **EDA (Event-Driven Architecture)** | Eventos como “algo pasó” para desacoplar servicios y permitir reacciones asíncronas. | Diseña el evento `CopiesReserved`: nombre, campos mínimos y 1 consumidor potencial (p. ej. “notificaciones”). |
| **Big Ball of Mud** | Monolito degradado donde la lógica de negocio y la técnica se enredan. | Localiza en tu código un área con alta densidad de dependencias cruzadas y anota qué límite te habría evitado ese acoplamiento. |
| **Arquitectura Hexagonal** | Separación clara entre **dominio** (reglas) e **infraestructura** (DB, frameworks, APIs) mediante puertos y adaptadores. | Dibuja un diagrama simple de puertos/adaptadores para el servicio que elegiste arriba. |

> Esta sesión profundiza en **Arquitectura Hexagonal** como base para implementar microservicios con un core estable y testeable.

### Warm-up práctico (10 min)

1. Crea la carpeta `curso/dia-02/ejercicios` siguiendo `curso/dia-02/04-avance-proyecto.md`.
2. Implementa el primer Value Object (`BookId`) y ejecuta el primer test con Vitest.
3. Marca (en el editor) qué es **dominio** vs **aplicación** vs **infra** mientras lo construís.
