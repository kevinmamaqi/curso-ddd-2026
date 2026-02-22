import { IntegrationMessage, ReleaseReservationRequestedEvent } from "../infra/integration/contracts";
import { InboxRepositoryPort } from "./ports/InboxRepositoryPort";
import { ReleaseReservationUseCase } from "./ReleaseReservationUseCase";

export class HandleReleaseReservationRequestedUseCase {
  constructor(
    private readonly releaseReservationUseCase: ReleaseReservationUseCase,
    private readonly inboxRepo: InboxRepositoryPort
  ) {}

  async execute(msg: IntegrationMessage<ReleaseReservationRequestedEvent>): Promise<void> {
    const accepted = await this.inboxRepo.tryAccept(msg.messageId);
    if (!accepted) return;

    const reservationId = msg.event.payload.reservationId;
    for (const line of msg.event.payload.lines) {
      await this.releaseReservationUseCase.execute({
        sku: line.sku,
        reservationId
      });
    }
  }
}

