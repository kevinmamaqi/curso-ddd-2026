import { ReserveBookUseCase } from "./ReserveBookUseCase";
import { ReserveStockRequestedEvent, IntegrationMessage } from "../infra/integration/contracts";
import { InboxRepositoryPort } from "./ports/InboxRepositoryPort";
import { InventoryIntegrationEventsPublisherPort } from "./ports/InventoryIntegrationEventsPublisherPort";
import { LoggerPort } from "./ports/LoggerPort";

export class HandleReserveStockRequestedUseCase {
  constructor(
    private readonly reserveBookUseCase: ReserveBookUseCase,
    private readonly inboxRepo: InboxRepositoryPort,
    private readonly integrationEvents: InventoryIntegrationEventsPublisherPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(msg: IntegrationMessage<ReserveStockRequestedEvent>): Promise<void> {
    const accepted = await this.inboxRepo.tryAccept(msg.messageId);
    if (!accepted) {
      this.logger.info({ messageId: msg.messageId }, "HandleReserveStockRequestedUseCase.duplicate_skip");
      return;
    }

    const reservationId = msg.event.payload.reservationId;
    this.logger.info(
      { reservationId, messageId: msg.messageId, linesCount: msg.event.payload.lines.length },
      "HandleReserveStockRequestedUseCase.execute"
    );

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
        this.logger.warn(
          { reservationId, sku: line.sku, qty: line.qty, reason },
          "HandleReserveStockRequestedUseCase.line_rejected"
        );
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
