import { IntegrationEventPublisherPort } from "../../application/ports";
import { IntegrationEvent, IntegrationMessage } from "../../domain/events";
import { AppConfig } from "../../config/config";
import { OutboxRepositoryPostgres } from "../repository/OutboxRepositoryPostgres";

export class OutboxIntegrationEventPublisher implements IntegrationEventPublisherPort {
  constructor(
    private readonly config: AppConfig,
    private readonly outboxRepo: OutboxRepositoryPostgres
  ) {}

  async publish(event: IntegrationEvent<string, unknown>): Promise<void> {
    if (event.type !== "ReserveStockRequested" && event.type !== "ReleaseReservationRequested") {
      throw new Error(`Unsupported integration event type: ${event.type}`);
    }

    const reservationId = (event.payload as any)?.reservationId;
    const { messageId, destination } =
      event.type === "ReserveStockRequested"
        ? {
            messageId: `${String(reservationId)}:ReserveStockRequested:v${event.version}`,
            destination: "fulfillment.reserve-stock-requested.v1"
          }
        : {
            messageId: `${String(reservationId)}:ReleaseReservationRequested:v${event.version}`,
            destination: "fulfillment.release-reservation-requested.v1"
          };

    const msg: IntegrationMessage<typeof event> = {
      messageId,
      correlationId: String(reservationId),
      event
    };

    await this.outboxRepo.enqueue({ id: messageId, destination, body: msg });
  }
}
