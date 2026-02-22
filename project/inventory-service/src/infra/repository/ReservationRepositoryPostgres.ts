import { ReservationRecord, ReservationRepositoryPort } from "../../application/ports/ReservationRepositoryPort";
import { DBClient } from "./pg";

export class ReservationRepositoryPostgres implements ReservationRepositoryPort {
  constructor(private readonly dbClient: DBClient) {}

  async initSchema(): Promise<void> {
    await this.dbClient.query(
      `
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
      `,
      []
    );
  }

  async tryCreate(params: {
    reservationId: string;
    sku: string;
    qty: number;
  }): Promise<boolean> {
    const result = await this.dbClient.query(
      `
      INSERT INTO inventory_reservations (reservation_id, sku, qty)
      VALUES ($1, $2, $3)
      ON CONFLICT (reservation_id, sku) DO NOTHING
      `,
      [params.reservationId, params.sku, params.qty]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getActiveQty(params: { reservationId: string; sku: string }): Promise<number | null> {
    const result = await this.dbClient.query(
      `
      SELECT qty
      FROM inventory_reservations
      WHERE reservation_id = $1 AND sku = $2 AND released_at IS NULL
      FOR UPDATE
      `,
      [params.reservationId, params.sku]
    );
    if (result.rows.length === 0) return null;
    return Number(result.rows[0].qty);
  }

  async markReleased(params: { reservationId: string; sku: string }): Promise<boolean> {
    const result = await this.dbClient.query(
      `
      UPDATE inventory_reservations
      SET released_at = now()
      WHERE reservation_id = $1 AND sku = $2 AND released_at IS NULL
      `,
      [params.reservationId, params.sku]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async listByReservationId(reservationId: string): Promise<ReservationRecord[]> {
    const result = await this.dbClient.query(
      `
      SELECT reservation_id, sku, qty, created_at, released_at
      FROM inventory_reservations
      WHERE reservation_id = $1
      ORDER BY created_at ASC
      `,
      [reservationId]
    );

    return result.rows.map((r: any) => ({
      reservationId: String(r.reservation_id),
      sku: String(r.sku),
      qty: Number(r.qty),
      createdAt: new Date(r.created_at).toISOString(),
      releasedAt: r.released_at ? new Date(r.released_at).toISOString() : undefined
    }));
  }
}
