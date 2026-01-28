# Taller práctico — Sesión 2 (crear ejercicios en `curso/` + transfer final a `project/`)

Objetivo: practicar Hexagonal + DDD táctico con ejemplos **conceptualmente cercanos** al proyecto (reservas de stock), pero construidos desde cero en clase para entender cada pieza. Al final, hacemos el “transfer” al `inventory-service`.

Stack (coherente con el repo): **Node 20 + TypeScript + Fastify + Vitest** (y `tsx` para dev).

## Guía de ritmo (3h)

| Tiempo | Actividad | Resultado observable |
|---:|---|---|
| 20 min | Setup del mini‑proyecto | `npm test` (Vitest) corre y compila TS. |
| 55 min | Core (dominio + aplicación) | VO + Aggregate + Use Case funcionando con adaptadores in‑memory. |
| 10 min | Descanso | — |
| 45 min | Adaptador HTTP + errores | API mínima (Fastify), thin adapter y mapeo de errores. |
| 40 min | Transfer al proyecto | Misma idea aplicada al `inventory-service` (mínimo 1 endpoint). |
| 10 min | Cierre | Checklist + dudas. |

## 1) Crear el mini‑proyecto (durante la clase)

En la raíz del repo:

```bash
mkdir -p curso/dia-02/ejercicios
cd curso/dia-02/ejercicios
npm init -y
npm i fastify
npm i -D typescript tsx vitest @types/node
```

Configura `package.json` (inspirado en `project/services/inventory-service/package.json`):

- `"type": "module"`
- scripts sugeridos:
  - `dev`: `tsx watch src/main.ts`
  - `test`: `vitest`
  - `test:run`: `vitest run`

Estructura mínima:

```text
curso/dia-02/ejercicios/
├── src/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── main.ts
└── test/
```

## 2) Core (dominio + aplicación) — qué vamos a construir

Mini‑dominio: **biblioteca** (stock de copias de un libro).

- `BookId` (Value Object) → formato `BOOK-0001`
- `Quantity` (Value Object) → entero positivo
- `BookStock` (Aggregate/Entity) → `reserve`, `release`, `replenish`
- `ReserveCopiesUseCase` → orquesta repo + publisher y ejecuta el caso de uso

### Skeletons mínimos (para crear en clase)

Value Object:

```ts
// src/domain/BookId.ts
export class BookId {
  // TODO: regex + invariantes + toString()
}
```

Puerto de salida:

```ts
// src/application/ports/BookStockRepositoryPort.ts
export interface BookStockRepositoryPort {
  // TODO: getByBookId + save
}
```

Use Case:

```ts
// src/application/use-cases/ReserveCopiesUseCase.ts
export class ReserveCopiesUseCase {
  async execute(command: { bookId: string; qty: number; reservationId: string }): Promise<void> {
    // TODO: VO -> cargar agregado -> reserve -> save -> publish
  }
}
```

## 3) Adaptador HTTP (Fastify) — thin adapter

En `src/main.ts`:

- crea Fastify
- registra rutas:
  - `GET /health`
  - `POST /book-stock/:bookId/reserve` (body: `{ qty, reservationId }`)
- valida **forma** (campos requeridos / tipos)
- delega al Use Case
- traduce errores del dominio a HTTP (400/404/409/500)

## 4) Validación rápida (curl) — ejercicios

```bash
curl -s http://localhost:3100/health

curl -i -X POST http://localhost:3100/book-stock/BOOK-0001/reserve \
  -H 'content-type: application/json' \
  -d '{"qty":2,"reservationId":"R-1"}'
```

## 5) Transfer al proyecto (40 min)

Mapeo 1:1:

- `BookId` → `SKU`
- `BookStock` → `ProductInventory`
- `ReserveCopiesUseCase` → `ReserveInventoryUseCase`
- In-memory → Postgres + RabbitMQ
- wiring manual → Awilix (DI)

Puntos de entrada:

- `project/services/inventory-service/src/infrastructure/http/ProductInventoryRouter.ts`
- `project/services/inventory-service/src/application/ReserveInventoryUseCase.ts`
- `project/services/inventory-service/src/domain/value-objects/SKU.ts`

## Stretch goals (si sobra tiempo)

1. Añade versionado al evento (`version`) y documenta qué significa.
2. Diseña 2 errores tipados de dominio y mapea a status (400/409).
3. Añade un segundo adaptador de entrada (CLI) para ejecutar el caso de uso sin HTTP.
