# Sesión 6 · Jueves 12-feb-2026  
## Repaso exprés de la Sesión 5

En la sesión 5 consolidamos DDD táctico en `inventory-service` (Aggregate Root, VOs y eventos) y abrimos el bounded context de `order-fulfillment-service` para practicar integración entre contextos (contratos, ACL y consistencia eventual). Con esa base, hoy damos el siguiente paso natural: **separar escritura y lectura** para escalar y optimizar consultas con **CQRS**.

| Tema | Take-away clave |
|------|-----------------|
| Aggregate Root | Una sola puerta de entrada al estado. |
| Domain Events | Verbo pasado, payload mínimo pero suficientemente informativo. |
| VO avanzados | Inmutables, iguales por valor. |
| Specification pattern | Simplificar lógica de negocio compleja. |
| Factories en aggregates | Crear objetos complejos paso a paso. |
