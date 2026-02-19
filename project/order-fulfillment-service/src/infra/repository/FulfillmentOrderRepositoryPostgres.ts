import { FulfillmentOrderRepositoryPort } from "../../application/ports";
import { FulfillmentOrder } from "../../domain/fulfillment-order";
import { FulfillmentOrderStatus } from "../../domain/fulfillment-order";
import { LineId, OrderId, Quantity, Sku } from "../../domain/value-objects";
import { DBClient } from "./pg";

type OrderSnapshot = {
  orderId: string;
  status: FulfillmentOrderStatus;
  reservationId?: string;
  lines: Array<{
    lineId: string;
    sku: string;
    qty: number;
    reservationStatus: "PENDING" | "CONFIRMED" | "REJECTED";
    rejectionReason?: string;
  }>;
};

export class FulfillmentOrderRepositoryPostgres implements FulfillmentOrderRepositoryPort {
  constructor(private readonly dbClient: DBClient) {}

  async initSchema(): Promise<void> {
    await this.dbClient.query(
      `
      CREATE TABLE IF NOT EXISTS fulfillment_orders (
        order_id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      `,
      []
    );
  }

  async getById(id: OrderId): Promise<FulfillmentOrder | null> {
    const result = await this.dbClient.query(
      `SELECT data FROM fulfillment_orders WHERE order_id = $1`,
      [id.toString()]
    );
    if (result.rows.length === 0) return null;

    const snapshot = result.rows[0].data as OrderSnapshot;
    return FulfillmentOrder.fromSnapshot({
      orderId: snapshot.orderId,
      status: snapshot.status,
      reservationId: snapshot.reservationId,
      lines: snapshot.lines.map((l) => ({
        lineId: LineId.of(l.lineId),
        sku: Sku.of(l.sku),
        qty: Quantity.of(l.qty),
        reservationStatus: l.reservationStatus,
        rejectionReason: l.rejectionReason
      }))
    });
  }

  async save(order: FulfillmentOrder): Promise<void> {
    const snapshot = order.toSnapshot();
    await this.dbClient.query(
      `
      INSERT INTO fulfillment_orders (order_id, data)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (order_id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = now()
      `,
      [snapshot.orderId, JSON.stringify(snapshot)]
    );
  }
}

