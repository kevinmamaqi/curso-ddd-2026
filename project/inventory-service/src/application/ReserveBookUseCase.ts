import { BookId } from "../domain/va/BookId";
import { Quantity } from "../domain/va/Quantity";
import { ReservationId } from "../domain/va/ReservationId";
import { BookEventsPublisherPort } from "./ports/BookEventsPublisherPort";
import { BookRepositoryPort } from "./ports/BookRepositoryPort";

export type ReserveBookCommand = {
    bookId: string;
    quantity: number;
    reservationId: string;
}

export class ReserveBookUseCase {
    constructor(
        private readonly bookRepo: BookRepositoryPort,
        private readonly bookEvents: BookEventsPublisherPort,
    ) {}

    async execute(command: ReserveBookCommand) {
        // 1. Validar el input.
        const bookId = BookId.of(command.bookId)

        // 2. Recuperar información del libro (si existe)
        const book = await this.bookRepo.findById(bookId.toString())

        // 3. Si no existe, not found
        if (!book) {
            throw new Error(`Book not found`);
        }

        // 4. Reservar
        const qty = Quantity.of(command.quantity);
        const reservationId = ReservationId.of(`${command.reservationId}`);
        book.reserve(reservationId, qty);

        // 5. Guardar el libro
        await this.bookRepo.save(book)

        // 6. Publicar un evento
        await this.bookEvents.publish("reserve", book.id.toString())
    }
}