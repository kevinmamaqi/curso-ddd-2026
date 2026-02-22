import { BookRepositoryPort } from "../../application/ports/BookRepositoryPort";
import { Book } from "../../domain/entities/BookStock";
import { DBClient } from "./pg";
import { toBookDomain } from "./transform";
import { ReservationId } from "../../domain/va/ReservationId";


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
        const res = await this.dbClient.query("SELECT * FROM books WHERE id = $1 FOR UPDATE", [id]);
        const row = res.rows[0];
        if (!row) return null;
        const book = toBookDomain(row);
        const reservationRows = await this.dbClient.query(
          `
          SELECT reservation_id, qty
          FROM inventory_reservations
          WHERE sku = $1 AND released_at IS NULL
          `,
          [id]
        );
        for (const r of reservationRows.rows as any[]) {
          book.hydrateReservation(ReservationId.of(String(r.reservation_id)), Number(r.qty));
        }
        return book;
    }

    async save(book: Book): Promise<void> {
        await this.dbClient.query(
            `
                INSERT INTO books (id, title, stock)
                VALUES ($1, $2, $3)
                ON CONFLICT (id) DO UPDATE
                    SET title = EXCLUDED.title,
                        stock = EXCLUDED.stock
            `,
            [book.id.toValue(), book.title, book.stock],
        );
    }
}
