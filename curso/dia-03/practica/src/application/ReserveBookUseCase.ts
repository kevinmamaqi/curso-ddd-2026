import { BookId } from "../domain/va/BookId";
import { BookEventsPublisherPort } from "./ports/BookEventsPublisherPort";
import { BookRepositoryPort } from "./ports/BookRepositoryPort";

type ReserveBookCommand = {
    bookId: string;
    quantity: number; 
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
        book.reserve(command.quantity);

        // 5. Guardar el libro
        await this.bookRepo.save(book)

        // 6. Publicar un evento
        await this.bookEvents.publish("reserve", book.id.toString())
    }
}