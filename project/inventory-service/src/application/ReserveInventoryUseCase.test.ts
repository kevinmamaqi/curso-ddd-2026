import { describe, expect, it } from "vitest"
import { mockBook, mockBookId } from "../../__mocks__/book"
import { BookRepositoryPort } from "./ports/BookRepositoryPort"
import { Book } from "../domain/entities/BookStock"
import { ReserveInventoryCommand, ReserveInventoryUseCase } from "./ReserveInventoryUseCase"
import { BookEventsPublisherPort } from "./ports/BookEventsPublisherPort"
import { InventoryViewRepositoryInMemory } from "../infra/repository/InventoryViewRepositoryInMemory"
import { InventoryViewProjector } from "./InventoryViewProjector"

class BookRepositoryMock implements BookRepositoryPort {
  constructor(private readonly book: Book) {}

  async findById(_id: string): Promise<Book | null> {
    return this.book
  }

  async save(_book: Book): Promise<void> {}
}

class BookEventsPublisherMock implements BookEventsPublisherPort {
  public published: Array<{ name: string; payload: string }> = []

  async publish(name: string, payload: string): Promise<void> {
    this.published.push({ name, payload })
  }
}

describe("ReserveInventoryUseCase", () => {
  it("reserves stock and updates the read model projection", async () => {
    const book = mockBook(mockBookId("02f75780-6afe-4b4e-9549-b648a3e51f56"))
    const repo = new BookRepositoryMock(book)
    const events = new BookEventsPublisherMock()
    const viewRepo = new InventoryViewRepositoryInMemory()
    const projector = new InventoryViewProjector(viewRepo)
    const uc = new ReserveInventoryUseCase(repo, events, projector)

    const cmd: ReserveInventoryCommand = {
      bookId: book.id.toValue(),
      quantity: 1,
      reservationId: "1d9a9175-2143-4bd1-b1c5-f540c68dc664",
    }

    await uc.execute(cmd)

    expect(book.stock).toBe(9)
    expect(events.published).toHaveLength(1)
    expect(events.published[0]?.name).toBe("StockReserved")

    const view = await viewRepo.findBySku(book.id.toValue())
    expect(view).not.toBeNull()
    expect(view?.available).toBe(9)
  })
})
