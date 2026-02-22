import { BookId } from "../domain/va/BookId";
import { ReservationId } from "../domain/va/ReservationId";
import { BookEventsPublisherPort } from "./ports/BookEventsPublisherPort";
import { BookRepositoryPort } from "./ports/BookRepositoryPort";
import { InventoryViewProjector } from "./InventoryViewProjector";
import { ReservationRepositoryPort } from "./ports/ReservationRepositoryPort";
import { UnitOfWorkPort } from "./ports/UnitOfWorkPort";

export type ReleaseReservationCommand = Readonly<{
  sku: string;
  reservationId: string;
}>;

export class ReleaseReservationUseCase {
  constructor(
    private readonly bookRepo: BookRepositoryPort,
    private readonly reservationRepo: ReservationRepositoryPort,
    private readonly bookEvents: BookEventsPublisherPort,
    private readonly inventoryViewProjector: InventoryViewProjector,
    private readonly uow: UnitOfWorkPort
  ) {}

  async execute(command: ReleaseReservationCommand): Promise<void> {
    await this.uow.runInTransaction(async () => {
      const sku = BookId.of(command.sku).toString();
      const reservationId = ReservationId.of(command.reservationId).toString();

      const activeQty = await this.reservationRepo.getActiveQty({ reservationId, sku });
      if (activeQty === null) {
        return;
      }

      const book = await this.bookRepo.findById(sku);
      if (!book) {
        throw new Error("Book not found");
      }

      book.releaseReservation(ReservationId.of(reservationId));
      const domainEvents = book.pullDomainEvents();

      await this.bookRepo.save(book);
      await this.reservationRepo.markReleased({ reservationId, sku });

      for (const event of domainEvents) {
        await this.bookEvents.publish(event.type, JSON.stringify(event.payload));
      }
      await this.inventoryViewProjector.project(domainEvents);
    });
  }
}

