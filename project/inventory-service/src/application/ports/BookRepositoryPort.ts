import { Book } from "../../domain/entities/BookStock";

export interface BookRepositoryPort {
    findById(id: string): Promise<Book | null>
    save(book: Book): Promise<void>
}
