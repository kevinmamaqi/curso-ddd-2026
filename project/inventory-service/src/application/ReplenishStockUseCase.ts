import { BookId } from "../domain/va/BookId";
import { Quantity } from "../domain/va/Quantity";
import { BookEventsPublisherPort } from "./ports/BookEventsPublisherPort";
import { BookRepositoryPort } from "./ports/BookRepositoryPort";
import { InventoryViewProjector } from "./InventoryViewProjector";
import { UnitOfWorkPort } from "./ports/UnitOfWorkPort";

export type ReplenishStockCommand = Readonly<{
  sku: string;
  quantity: number;
}>;

export class ReplenishStockUseCase {
  constructor(
    private readonly bookRepo: BookRepositoryPort,
    private readonly bookEvents: BookEventsPublisherPort,
    private readonly inventoryViewProjector: InventoryViewProjector,
    private readonly uow: UnitOfWorkPort
  ) {}

  async execute(command: ReplenishStockCommand): Promise<void> {
    await this.uow.runInTransaction(async () => {
      const bookId = BookId.of(command.sku);
      const book = await this.bookRepo.findById(bookId.toString());
      if (!book) {
        throw new Error("Book not found");
      }

      const qty = Quantity.of(command.quantity);
      book.replenish(qty);
      const domainEvents = book.pullDomainEvents();

      await this.bookRepo.save(book);

      for (const event of domainEvents) {
        await this.bookEvents.publish(event.type, JSON.stringify(event.payload));
      }
      await this.inventoryViewProjector.project(domainEvents);
    });
  }
}

