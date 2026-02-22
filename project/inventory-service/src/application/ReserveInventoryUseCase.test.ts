import { describe, expect, it } from "vitest"
import { mockBook, mockBookId } from "../../__mocks__/book"
import { BookRepositoryPort } from "./ports/BookRepositoryPort"
import { Book } from "../domain/entities/BookStock"
import { ReserveInventoryCommand, ReserveInventoryUseCase } from "./ReserveInventoryUseCase"
import { BookEventsPublisherPort } from "./ports/BookEventsPublisherPort"
import { InventoryViewRepositoryInMemory } from "../infra/repository/InventoryViewRepositoryInMemory"
import { InventoryViewProjector } from "./InventoryViewProjector"
import { ReservationRepositoryPort } from "./ports/ReservationRepositoryPort"
import { UnitOfWorkPort } from "./ports/UnitOfWorkPort"

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

class ReservationRepositoryMock implements ReservationRepositoryPort {
  private readonly rows = new Map<string, { qty: number; released: boolean }>()

  async initSchema(): Promise<void> {}

  async tryCreate(params: { reservationId: string; sku: string; qty: number }): Promise<boolean> {
    const key = `${params.reservationId}:${params.sku}`
    if (this.rows.has(key)) return false
    this.rows.set(key, { qty: params.qty, released: false })
    return true
  }

  async getActiveQty(params: { reservationId: string; sku: string }): Promise<number | null> {
    const key = `${params.reservationId}:${params.sku}`
    const row = this.rows.get(key)
    if (!row || row.released) return null
    return row.qty
  }

  async markReleased(params: { reservationId: string; sku: string }): Promise<boolean> {
    const key = `${params.reservationId}:${params.sku}`
    const row = this.rows.get(key)
    if (!row || row.released) return false
    row.released = true
    return true
  }

  async listByReservationId(_reservationId: string) {
    return []
  }
}

class UnitOfWorkMock implements UnitOfWorkPort {
  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return await fn()
  }
}

describe("ReserveInventoryUseCase", () => {
  it("reserves stock and updates the read model projection", async () => {
    const book = mockBook(mockBookId("02f75780-6afe-4b4e-9549-b648a3e51f56"))
    const repo = new BookRepositoryMock(book)
    const events = new BookEventsPublisherMock()
    const reservationRepo = new ReservationRepositoryMock()
    const viewRepo = new InventoryViewRepositoryInMemory()
    const projector = new InventoryViewProjector(viewRepo)
    const uow = new UnitOfWorkMock()
    const uc = new ReserveInventoryUseCase(repo, reservationRepo, events, projector, uow)

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
