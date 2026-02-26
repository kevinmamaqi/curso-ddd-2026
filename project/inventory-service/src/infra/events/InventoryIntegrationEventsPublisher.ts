import { AppConfig } from "../../config/config";
import {
  IntegrationMessage,
  InventoryResultEvent,
  nowIso
} from "../integration/contracts";
import { OutboxRepositoryPostgres } from "../repository/OutboxRepositoryPostgres";
import { InventoryIntegrationEventsPublisherPort } from "../../application/ports/InventoryIntegrationEventsPublisherPort";
import { context, propagation } from "@opentelemetry/api";

export class InventoryIntegrationEventsPublisher implements InventoryIntegrationEventsPublisherPort {
  constructor(
    private readonly config: AppConfig,
    private readonly outboxRepo: OutboxRepositoryPostgres
  ) {}

  async publishResultEvent(params: {
    reservationId: string;
    sku: string;
    kind: "reserved" | "rejected";
    qty?: number;
    reason?: string;
  }): Promise<void> {
    const event: InventoryResultEvent =
      params.kind === "reserved"
        ? {
            type: "StockReserved",
            version: 1,
            occurredAt: nowIso(),
            payload: {
              reservationId: params.reservationId,
              sku: params.sku,
              qty: params.qty ?? 0
            }
          }
        : {
            type: "StockReservationRejected",
            version: 1,
            occurredAt: nowIso(),
            payload: {
              reservationId: params.reservationId,
              sku: params.sku,
              reason: params.reason ?? "UNKNOWN"
            }
          };

    const messageId = `${params.reservationId}:${params.sku}:${event.type}:v${event.version}`;
    // EDA: destination == RabbitMQ routing key
    const destination =
      event.type === "StockReserved"
        ? "inventory.stock-reserved.v1"
        : "inventory.stock-rejected.v1";

    const msg: IntegrationMessage<typeof event> = {
      messageId,
      correlationId: params.reservationId,
      headers: this.captureTraceHeaders(),
      event
    };

    await this.outboxRepo.enqueue({ id: messageId, destination, body: msg });
  }

  private captureTraceHeaders(): Record<string, string> {
    const carrier: Record<string, string> = {};
    propagation.inject(context.active(), carrier);
    return carrier;
  }
}
