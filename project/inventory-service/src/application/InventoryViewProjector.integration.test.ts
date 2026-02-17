import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql"
import { DBClient } from "../infra/repository/pg"
import { BookRepositoryPostgres } from "../infra/repository/BookRepositoryPostgres"
import { InventoryViewRepositoryPostgres } from "../infra/repository/InventoryViewRepositoryPostgres"
import { Book } from "../domain/entities/BookStock"
import { BookId } from "../domain/va/BookId"
import { ReserveBookUseCase } from "./ReserveBookUseCase"
import { InventoryViewProjector } from "./InventoryViewProjector"
import { BookEventsPublisherPort } from "./ports/BookEventsPublisherPort"

class BookEventsPublisherMock implements BookEventsPublisherPort {
  async publish(): Promise<void> {}
}

const uuid = "e37a8465-6d00-4ee0-ac2a-85f6839e90e9"

const describeIntegration = process.env.RUN_INTEGRATION_TESTS ? describe : describe.skip

describeIntegration("InventoryViewProjector (integration)", () => {
  const container = new PostgreSqlContainer("postgres:17.1-alpine")
  let started: StartedPostgreSqlContainer
  let dbClient: DBClient

  beforeAll(async () => {
    started = await container.start()

    dbClient = new DBClient({
      dbHost: started.getHost(),
      dbPort: started.getPort(),
      dbUser: started.getUsername(),
      dbPassword: started.getPassword(),
      dbName: started.getDatabase(),
    })

    await dbClient.connect()

    const bookRepo = new BookRepositoryPostgres(dbClient)
    await bookRepo.initSchema()

    const viewRepo = new InventoryViewRepositoryPostgres(dbClient)
    await viewRepo.initSchema()

    await bookRepo.save(new Book(BookId.of(uuid), "Test Book", 10))
  }, 30_000)

  afterAll(async () => {
    await dbClient.disconnect()
    await started.stop()
  })

  it("projects StockReserved into inventory_view", async () => {
    const bookRepo = new BookRepositoryPostgres(dbClient)
    const viewRepo = new InventoryViewRepositoryPostgres(dbClient)
    const projector = new InventoryViewProjector(viewRepo)
    const events = new BookEventsPublisherMock()

    const uc = new ReserveBookUseCase(bookRepo, events, projector)
    await uc.execute({
      bookId: uuid,
      quantity: 1,
      reservationId: "1d9a9175-2143-4bd1-b1c5-f540c68dc664",
    })

    const projected = await viewRepo.findBySku(uuid)
    expect(projected).not.toBeNull()
    expect(projected?.available).toBe(9)
  })
})
