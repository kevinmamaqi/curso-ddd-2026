import { BookRepositoryPort } from "../../application/ports/BookRepositoryPort";
import { Book } from "../../domain/entities/Book";


export class BookRepositoryInMemory implements BookRepositoryPort {
    private books: Map<string, Book> = new Map();

    async findById(id: string): Promise<Book | null> {
        return this.books.get(id) || null;
    }

    async save(book: Book): Promise<void> {
         this.books.set(book.id.toString(), book)
    }
}