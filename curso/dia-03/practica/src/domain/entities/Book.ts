import { BookId } from "../va/BookId";

export class Book {
    readonly id: BookId;
    public title: string;
    public stock: number;

    constructor(id: BookId, title: string, stock: number) {
        this.id = id;
        this.title = title;
        this.stock = stock;
    }

    getAvailableCopies(): number {
        return this.stock;
    }

    getIsAvailable(): boolean {
        if (this.stock > 0) {
            return true
        }
        return false;
    }

    reserve(qty: number) {
        if (this.stock < qty) {
            throw new Error("Not enough stock")
        }
        this.stock = this.stock - qty;
    }
}