import { InventoryView, InventoryViewRepositoryPort } from "../../application/ports/InventoryViewRepositoryPort"
import { DBClient } from "./pg"

export class InventoryViewRepositoryPostgres implements InventoryViewRepositoryPort {
  constructor(private readonly dbClient: DBClient) {}

  async initSchema(): Promise<void> {
    await this.dbClient.query(
      `
        CREATE TABLE IF NOT EXISTS inventory_view (
          sku UUID PRIMARY KEY,
          available INT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `,
      [],
    )
  }

  async upsert(view: InventoryView): Promise<void> {
    await this.dbClient.query(
      `
        INSERT INTO inventory_view (sku, available, updated_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (sku) DO UPDATE
          SET available = EXCLUDED.available,
              updated_at = EXCLUDED.updated_at
      `,
      [view.sku, view.available, view.updatedAt],
    )
  }

  async findBySku(sku: string): Promise<InventoryView | null> {
    const res = await this.dbClient.query("SELECT sku, available, updated_at FROM inventory_view WHERE sku = $1", [sku])
    const row = res.rows[0]
    if (!row) return null

    return {
      sku: row.sku,
      available: Number(row.available),
      updatedAt: new Date(row.updated_at),
    }
  }
}

