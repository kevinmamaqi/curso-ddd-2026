import { OrderStatusView, OrderStatusViewRepositoryPort } from "../../application/ports";
import { DBClient } from "./pg";

export class OrderStatusViewRepositoryPostgres implements OrderStatusViewRepositoryPort {
  constructor(private readonly dbClient: DBClient) {}

  async initSchema(): Promise<void> {
    await this.dbClient.query(
      `
      CREATE TABLE IF NOT EXISTS order_status_view (
        order_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        reservation_id TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      `,
      []
    );
  }

  async upsert(view: OrderStatusView): Promise<void> {
    await this.dbClient.query(
      `
      INSERT INTO order_status_view (order_id, status, reservation_id, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (order_id) DO UPDATE SET
        status = EXCLUDED.status,
        reservation_id = EXCLUDED.reservation_id,
        updated_at = EXCLUDED.updated_at
      `,
      [view.orderId, view.status, view.reservationId ?? null, view.updatedAt]
    );
  }

  async getById(orderId: string): Promise<OrderStatusView | null> {
    const result = await this.dbClient.query(
      `
      SELECT order_id, status, reservation_id, updated_at
      FROM order_status_view
      WHERE order_id = $1
      `,
      [orderId]
    );
    if (result.rows.length === 0) return null;
    const row: any = result.rows[0];
    return {
      orderId: String(row.order_id),
      status: String(row.status),
      reservationId: row.reservation_id ? String(row.reservation_id) : undefined,
      updatedAt: new Date(row.updated_at).toISOString()
    };
  }
}

