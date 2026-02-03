import { BookRepositoryPort } from "../../application/ports/BookRepositoryPort";
import { Book } from "../../domain/entities/Book";
import { BookId } from "../../domain/va/BookId";
import { DBClient } from "./pg";

type BookDBEntity = {
    id: string;
    title: string;
    stock: number;
}

function toBookDomain(row: any): Book {
    console.log("row", row)
    const book = new Book(BookId.of(row.id), row.title, row.stock);
    console.log("book", book)
    return book;
}



export class BookRepositoryPostgres implements BookRepositoryPort {
    constructor(private readonly dbClient: DBClient) {}

    async initSchema() {
        await this.dbClient.query(`
            CREATE TABLE IF NOT EXISTS books (
                id UUID PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                stock INT NOT NULL
            )
        `, []);
    }

    async findById(id: string): Promise<Book | null> {
        const res = await this.dbClient.query("SELECT * FROM books WHERE id = $1", [id]);
        return toBookDomain(res.rows[0]) || null;
    }

    async save(book: Book): Promise<void> {
        await this.dbClient.query("INSERT INTO books (id, title, stock) VALUES ($1, $2, $3)", [book.id.toValue(), book.title, book.stock]);
    }
}