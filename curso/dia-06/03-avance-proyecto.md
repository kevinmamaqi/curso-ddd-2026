# Avance del proyecto · Sesión 6 — CQRS en Inventory

**En sesión (40 min) + trabajo en casa**

Antes de avanzar, asegúrate de estar en el mismo punto de llegada que la sesión 5: `inventory-service` con su modelo de escritura “rico” y (si lo hiciste) el nuevo `order-fulfillment-service` como bounded context separado. La sesión 6 parte de esa base y la evoluciona sin romper lo anterior: añadimos un **read model** y una **proyección** para que las consultas no dependan del modelo de escritura.

## Meta de hoy

Introducir CQRS de forma incremental: mantener el modelo de escritura “rico” y crear una lectura optimizada (read model) que se actualiza por eventos/proyecciones.

### Tareas sugeridas

1. Definir un caso de uso de escritura (command) y uno de lectura (query)
   - `ReserveInventoryUseCase` (command)
   - `GetInventoryBySkuQuery` (query)
2. Crear un read model mínimo
   - Tabla/colección `inventory_view` con `{ sku, available, updatedAt }`
3. Añadir un proyector
   - Consume eventos de inventario y actualiza `inventory_view`.
4. Ajustar el endpoint de lectura
   - `GET /inventory/:sku` lee desde el read model (o deja una variante `/inventory/:sku/view`).
5. Pruebas
   - Unit tests para comandos y tests de integración para la proyección.
