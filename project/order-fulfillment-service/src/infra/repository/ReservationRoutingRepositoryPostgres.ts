import { ReservationRouting, ReservationRoutingRepositoryPort } from "../../application/ports";
import { DBClient } from "./pg";

export class ReservationRoutingRepositoryPostgres implements ReservationRoutingRepositoryPort {
  constructor(private readonly dbClient: DBClient) {}

  async initSchema(): Promise<void> {
    await this.dbClient.query(
      `
      CREATE TABLE IF NOT EXISTS reservation_routing (
        reservation_id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        line_by_sku JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      `,
      []
    );
  }

  async save(routing: ReservationRouting): Promise<void> {
    await this.dbClient.query(
      `
      INSERT INTO reservation_routing (reservation_id, order_id, line_by_sku)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (reservation_id) DO UPDATE SET
        order_id = EXCLUDED.order_id,
        line_by_sku = EXCLUDED.line_by_sku
      `,
      [routing.reservationId, routing.orderId, JSON.stringify(routing.lineBySku)]
    );
  }

  async getByReservationId(reservationId: string): Promise<ReservationRouting | null> {
    const result = await this.dbClient.query(
      `
      SELECT reservation_id, order_id, line_by_sku
      FROM reservation_routing
      WHERE reservation_id = $1
      `,
      [reservationId]
    );
    if (result.rows.length === 0) return null;

    const row: any = result.rows[0];
    return {
      reservationId: String(row.reservation_id),
      orderId: String(row.order_id),
      lineBySku: row.line_by_sku as Record<string, string>
    };
  }
}

