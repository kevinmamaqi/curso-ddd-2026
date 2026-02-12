import { Book } from "../../domain/entities/BookStock";
import { BookId } from "../../domain/va/BookId";

export function toBookDomain(row: any): Book {
    const book = new Book(BookId.of(row.id), row.title, row.stock);
    return book;
}
