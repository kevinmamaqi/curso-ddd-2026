import { AggregateRoot } from "./aggregate-root";
import { FulfillmentDomainEvents, nowIso } from "./events";
import { LineId, OrderId, Quantity, Sku } from "./value-objects";

type LineReservationStatus = "PENDING" | "CONFIRMED" | "REJECTED";

type FulfillmentLine = {
  lineId: LineId;
  sku: Sku;
  qty: Quantity;
  reservationStatus: LineReservationStatus;
  rejectionReason?: string;
};

export type FulfillmentOrderStatus =
  | "DRAFT"
  | "PLACED"
  | "RESERVATION_PENDING"
  | "PARTIALLY_RESERVED"
  | "RESERVED"
  | "REJECTED"
  | "READY_TO_SHIP"
  | "CANCELLED"
  | "SHIPPED";

export class FulfillmentOrder extends AggregateRoot {
  private status: FulfillmentOrderStatus = "DRAFT";
  private readonly lines = new Map<string, FulfillmentLine>();
  private reservationId?: string;

  private constructor(readonly id: OrderId) {
    super();
  }

  static fromSnapshot(snapshot: {
    orderId: string;
    status: FulfillmentOrderStatus;
    reservationId?: string;
    lines: Array<{
      lineId: LineId;
      sku: Sku;
      qty: Quantity;
      reservationStatus: LineReservationStatus;
      rejectionReason?: string;
    }>;
  }): FulfillmentOrder {
    const order = new FulfillmentOrder(OrderId.of(snapshot.orderId));
    order.status = snapshot.status;
    order.reservationId = snapshot.reservationId;

    for (const l of snapshot.lines) {
      order.lines.set(l.lineId.toString(), {
        lineId: l.lineId,
        sku: l.sku,
        qty: l.qty,
        reservationStatus: l.reservationStatus,
        rejectionReason: l.rejectionReason
      });
    }

    return order;
  }

  toSnapshot(): {
    orderId: string;
    status: FulfillmentOrderStatus;
    reservationId?: string;
    lines: Array<{
      lineId: string;
      sku: string;
      qty: number;
      reservationStatus: LineReservationStatus;
      rejectionReason?: string;
    }>;
  } {
    return {
      orderId: this.id.toString(),
      status: this.status,
      reservationId: this.reservationId,
      lines: Array.from(this.lines.values()).map((l) => ({
        lineId: l.lineId.toString(),
        sku: l.sku.toString(),
        qty: l.qty.toNumber(),
        reservationStatus: l.reservationStatus,
        rejectionReason: l.rejectionReason
      }))
    };
  }

  static place(params: {
    orderId: OrderId;
    lines: Array<{ lineId: LineId; sku: Sku; qty: Quantity }>;
  }): FulfillmentOrder {
    if (params.lines.length === 0) {
      throw new Error("Order must contain at least one line.");
    }

    const order = new FulfillmentOrder(params.orderId);
    order.status = "PLACED";

    for (const l of params.lines) {
      order.lines.set(l.lineId.toString(), {
        lineId: l.lineId,
        sku: l.sku,
        qty: l.qty,
        reservationStatus: "PENDING"
      });
    }

    order.record({
      type: "FulfillmentOrderPlaced",
      occurredAt: nowIso(),
      payload: { orderId: order.id.toString(), lineCount: params.lines.length }
    });

    return order;
  }

  requestReservation(reservationId: string): void {
    if (this.status !== "PLACED") {
      throw new Error(`Cannot request reservation in status ${this.status}`);
    }
    if (!reservationId) {
      throw new Error("reservationId is required.");
    }

    this.status = "RESERVATION_PENDING";
    this.reservationId = reservationId;

    const payloadLines = Array.from(this.lines.values()).map((l) => ({
      lineId: l.lineId.toString(),
      sku: l.sku.toString(),
      qty: l.qty.toNumber()
    }));

    this.record({
      type: "ReservationRequested",
      occurredAt: nowIso(),
      payload: { orderId: this.id.toString(), reservationId, lines: payloadLines }
    });
  }

  confirmLineReservation(params: { lineId: LineId; sku: Sku; qty: Quantity }): void {
    if (this.status === "CANCELLED" || this.status === "SHIPPED") return;

    const line = this.lines.get(params.lineId.toString());
    if (!line) throw new Error("Line not found.");

    if (line.reservationStatus === "CONFIRMED") return; // idempotencia local
    if (line.reservationStatus === "REJECTED") {
      throw new Error("Cannot confirm a rejected line.");
    }

    line.reservationStatus = "CONFIRMED";
    this.recomputeStatus();

    this.record({
      type: "ReservationConfirmed",
      occurredAt: nowIso(),
      payload: {
        orderId: this.id.toString(),
        lineId: params.lineId.toString(),
        sku: params.sku.toString(),
        qty: params.qty.toNumber()
      }
    });
  }

  rejectLineReservation(params: { lineId: LineId; sku: Sku; reason: string }): void {
    if (this.status === "CANCELLED" || this.status === "SHIPPED") return;

    const line = this.lines.get(params.lineId.toString());
    if (!line) throw new Error("Line not found.");

    if (line.reservationStatus === "REJECTED") return; // idempotencia local
    if (line.reservationStatus === "CONFIRMED") {
      throw new Error("Cannot reject a confirmed line.");
    }

    line.reservationStatus = "REJECTED";
    line.rejectionReason = params.reason;
    this.recomputeStatus();

    this.record({
      type: "ReservationRejected",
      occurredAt: nowIso(),
      payload: {
        orderId: this.id.toString(),
        lineId: params.lineId.toString(),
        sku: params.sku.toString(),
        reason: params.reason
      }
    });
  }

  markReadyToShip(): void {
    if (this.status !== "RESERVED") {
      throw new Error("Order is not fully reserved.");
    }
    this.status = "READY_TO_SHIP";
    this.record({
      type: "FulfillmentOrderReadyToShip",
      occurredAt: nowIso(),
      payload: { orderId: this.id.toString() }
    });
  }

  cancel(): void {
    if (this.status === "CANCELLED") return;
    if (this.status === "SHIPPED") {
      throw new Error("Cannot cancel a shipped order.");
    }

    this.status = "CANCELLED";
    this.record({
      type: "OrderCancelled",
      occurredAt: nowIso(),
      payload: { orderId: this.id.toString(), reservationId: this.reservationId }
    });
  }

  getPickList(): Array<{ lineId: string; sku: string; qty: number }> {
    return Array.from(this.lines.values()).map((l) => ({
      lineId: l.lineId.toString(),
      sku: l.sku.toString(),
      qty: l.qty.toNumber()
    }));
  }

  getStatus(): FulfillmentOrderStatus {
    return this.status;
  }

  getReservationId(): string | undefined {
    return this.reservationId;
  }

  getLinesSnapshot(): Array<{
    lineId: string;
    sku: string;
    qty: number;
    reservationStatus: LineReservationStatus;
    rejectionReason?: string;
  }> {
    return Array.from(this.lines.values()).map((l) => ({
      lineId: l.lineId.toString(),
      sku: l.sku.toString(),
      qty: l.qty.toNumber(),
      reservationStatus: l.reservationStatus,
      rejectionReason: l.rejectionReason
    }));
  }

  private recomputeStatus(): void {
    const lines = Array.from(this.lines.values());
    const confirmed = lines.filter((l) => l.reservationStatus === "CONFIRMED").length;
    const rejected = lines.filter((l) => l.reservationStatus === "REJECTED").length;

    if (rejected > 0) {
      this.status = "REJECTED";
      return;
    }

    if (confirmed === lines.length) {
      this.status = "RESERVED";
      return;
    }

    if (confirmed > 0) {
      this.status = "PARTIALLY_RESERVED";
      return;
    }

    this.status = "RESERVATION_PENDING";
  }
}
