import { ReserveBookUseCase } from "./ReserveBookUseCase";
import { ReserveStockRequestedEvent, IntegrationMessage } from "../infra/integration/contracts";
import { InboxRepositoryPort } from "./ports/InboxRepositoryPort";
import { InventoryIntegrationEventsPublisherPort } from "./ports/InventoryIntegrationEventsPublisherPort";

export class HandleReserveStockRequestedUseCase {
  constructor(
    private readonly reserveBookUseCase: ReserveBookUseCase,
    private readonly inboxRepo: InboxRepositoryPort,
    private readonly integrationEvents: InventoryIntegrationEventsPublisherPort
  ) {}

  async execute(msg: IntegrationMessage<ReserveStockRequestedEvent>): Promise<void> {
    const accepted = await this.inboxRepo.tryAccept(msg.messageId);
    if (!accepted) return;

    const reservationId = msg.event.payload.reservationId;
    for (const line of msg.event.payload.lines) {
      try {
        await this.reserveBookUseCase.execute({
          bookId: line.sku,
          quantity: line.qty,
          reservationId
        });

        await this.integrationEvents.publishResultEvent({
          reservationId,
          sku: line.sku,
          kind: "reserved",
          qty: line.qty
        });
      } catch (err) {
        const reason = err instanceof Error ? err.message : "UNKNOWN";
        await this.integrationEvents.publishResultEvent({
          reservationId,
          sku: line.sku,
          kind: "rejected",
          reason
        });
      }
    }
  }
}
