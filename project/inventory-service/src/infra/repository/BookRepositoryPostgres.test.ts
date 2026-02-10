// Integration Test with TestContainers
import { describe, beforeAll, afterAll, beforeEach, it, expect } from "vitest";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { BookRepositoryPostgres } from "./BookRepositoryPostgres";
import { DBClient } from "./pg";
import { Book } from "../../domain/entities/BookStock";
import { BookId } from "../../domain/va/BookId";

const uuid = "e37a8465-6d00-4ee0-ac2a-85f6839e90e9";

describe("BookRepositoryPostgres", () => {
    let container = new PostgreSqlContainer("postgres:17.1-alpine");
    let dbClient: DBClient;
    let repo: BookRepositoryPostgres;

    beforeAll(async () => {
        const started = await container.start();
        
        dbClient = new DBClient({
            dbHost: started.getHost(),
            dbPort: started.getPort(),
            dbUser: started.getUsername(),
            dbPassword: started.getPassword(),
            dbName: started.getDatabase(),
        });
        await dbClient.connect()
        repo = new BookRepositoryPostgres(dbClient);
        await repo.initSchema(); 
    }, 30_000);

    afterAll(async () => {
        await dbClient.disconnect();
    });

    beforeEach(async () => {
        repo = new BookRepositoryPostgres(dbClient);
    });
    
    it("should save a book", async () => {
        const book = new Book(new BookId(uuid), "Test Book", 10);
        await repo.save(book);
        const savedBook = await repo.findById(uuid);
        expect(savedBook).toEqual(book);
    });
});