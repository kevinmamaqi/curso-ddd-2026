import { BookRepositoryPort } from "../../application/ports/BookRepositoryPort";
import { Book } from "../../domain/entities/BookStock";
import { DBClient } from "./pg";
import { toBookDomain } from "./transform";


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