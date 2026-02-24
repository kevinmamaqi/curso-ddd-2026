-- Seed mínimo para que el Día 9/10 arranque con datos visibles (inventario + read model).
-- Nota: el servicio también ejecuta `initSchema()`, así que usamos IF NOT EXISTS para ser idempotentes.

\c inventory

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  stock INT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_view (
  sku UUID PRIMARY KEY,
  available INT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  reservation_id TEXT NOT NULL,
  sku UUID NOT NULL,
  qty INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ,
  PRIMARY KEY (reservation_id, sku)
);

CREATE INDEX IF NOT EXISTS inventory_reservations_reservation_id_idx
ON inventory_reservations (reservation_id);

INSERT INTO books (id, title, stock) VALUES
  ('11111111-1111-1111-1111-111111111111', 'DDD Book (Seed)', 25),
  ('22222222-2222-2222-2222-222222222222', 'Hexagonal Book (Seed)', 10),
  ('33333333-3333-3333-3333-333333333333', 'EDA Book (Seed)', 5)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  stock = EXCLUDED.stock;

INSERT INTO inventory_view (sku, available, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 25, now()),
  ('22222222-2222-2222-2222-222222222222', 10, now()),
  ('33333333-3333-3333-3333-333333333333', 5, now())
ON CONFLICT (sku) DO UPDATE SET
  available = EXCLUDED.available,
  updated_at = EXCLUDED.updated_at;

