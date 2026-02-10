import { BookId } from '../src/domain/va/BookId'
import { Book } from '../src/domain/entities/BookStock'

export const mockBookId = (id: string) => new BookId(id)
export const mockBook = (bookId: BookId) => new Book(bookId, "test", 10)