import { describe, expect, it } from "vitest";
import { mockBook, mockBookId } from "../../__mocks__/book";
import { BookRepositoryPort } from "./ports/BookRepositoryPort"
import { Book } from "../domain/entities/BookStock";
import { ReserveBookCommand, ReserveBookUseCase } from "./ReserveBookUseCase";
import { BookEventsPublisherPort } from "./ports/BookEventsPublisherPort";



export class BooktRepositoryMock implements BookRepositoryPort {
    async findById(id: string) {
        const bId = mockBookId(id)
        const book = mockBook(bId)
        return book
    }
    async save(book: Book) {}
}

export class BookEventsPublisherMock implements BookEventsPublisherPort {
    public published: any[] = []
    async publish(name: string, payload: string) {
        this.published.push({
            name,
            payload
        })
    }
}

describe("ReserveBookUseCsae.test.ts", () => {
    it("should reserve a copy on success", async ()=>{
        const repo = new BooktRepositoryMock()
        const eventsMock = new BookEventsPublisherMock()
        const uc = new ReserveBookUseCase(repo, eventsMock)

        const cmd: ReserveBookCommand = {
            bookId: "02f75780-6afe-4b4e-9549-b648a3e51f56",
            quantity: 1,
            reservationId: "1d9a9175-2143-4bd1-b1c5-f540c68dc664"
        }

        await uc.execute(cmd)
        expect(mockBook.domainEvents).toHaveLength(1)
    })

    it()
})

describe("")