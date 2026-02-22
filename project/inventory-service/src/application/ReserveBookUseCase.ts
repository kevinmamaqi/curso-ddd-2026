import { BookId } from "../domain/va/BookId";
import { Quantity } from "../domain/va/Quantity";
import { ReservationId } from "../domain/va/ReservationId";
import { BookEventsPublisherPort } from "./ports/BookEventsPublisherPort";
import { BookRepositoryPort } from "./ports/BookRepositoryPort";
import { InventoryViewProjector } from "./InventoryViewProjector";
import { ReservationRepositoryPort } from "./ports/ReservationRepositoryPort";
import { UnitOfWorkPort } from "./ports/UnitOfWorkPort";

export type ReserveBookCommand = {
    bookId: string;
    quantity: number;
    reservationId: string;
}

export class ReserveBookUseCase {
    constructor(
        private readonly bookRepo: BookRepositoryPort,
        private readonly reservationRepo: ReservationRepositoryPort,
        private readonly bookEvents: BookEventsPublisherPort,
        private readonly inventoryViewProjector: InventoryViewProjector,
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(command: ReserveBookCommand) {
        await this.uow.runInTransaction(async () => {
            // 1. Validar el input.
            const bookId = BookId.of(command.bookId)
            const reservationId = ReservationId.of(`${command.reservationId}`);
            const qty = Quantity.of(command.quantity);

            // 2. Idempotencia: si ya existe una reserva activa, no hacemos nada.
            const alreadyReserved = await this.reservationRepo.getActiveQty({
                reservationId: reservationId.toValue(),
                sku: bookId.toValue(),
            })
            if (alreadyReserved !== null) {
                return
            }

            // 2. Recuperar información del libro (si existe)
            const book = await this.bookRepo.findById(bookId.toString())

            // 3. Si no existe, not found
            if (!book) {
                throw new Error(`Book not found`);
            }

            // 4. Registrar primero en DB para evitar efectos parciales ante duplicados.
            const created = await this.reservationRepo.tryCreate({
                reservationId: reservationId.toValue(),
                sku: bookId.toValue(),
                qty: qty.toValue(),
            })
            if (!created) {
                return
            }

            // 5. Reservar en el agregado
            book.reserve(reservationId, qty);

            const domainEvents = book.pullDomainEvents();

            // 6. Guardar el libro
            await this.bookRepo.save(book)

            // 7. Publicar un evento (contrato simple) y actualizar el read model (CQRS)
            for (const event of domainEvents) {
                await this.bookEvents.publish(event.type, JSON.stringify(event.payload))
            }
            await this.inventoryViewProjector.project(domainEvents)
        })
    }
}
