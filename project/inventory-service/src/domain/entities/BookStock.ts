import { InvalidReservationIdError } from "../errors";
import { BookId } from "../va/BookId";
import { Quantity } from "../va/Quantity";
import { ReservationId } from "../va/ReservationId";

export class Book {
    readonly id: BookId;
    public title: string;
    public stock: number;
    public domainEvents: any[];
    private readonly reservations: Map<ReservationId, number> = new Map();

    constructor(id: BookId, title: string, stock: number) {
        this.id = id;
        this.title = title;
        this.stock = stock;
        this.domainEvents = [];
    }

    reserve(reservationId: ReservationId, qty: Quantity) {
        if (this.reservations.has(reservationId)) {
            throw new InvalidReservationIdError(`The reservationId ${reservationId.toString()} already exists`);
        }
        if (this.stock < qty.toValue()) {
            throw new Error("Not enough stock")
        }
        this.stock = this.stock - qty.toValue();
        this.domainEvents.push({
            eventName: "reserved",
            payload: {
                id: this.id.toValue(),
                qty: qty.toValue(),
                tz: Date.now()
            }
        })
    }

    replenish(qty: Quantity) {
        this.stock = this.stock + qty.toValue();
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

    getReservedCopies(): number {
        return Array.from(this.reservations.values())
            .reduce((acc, curr) => acc + curr, 0);
    }
    
    releaseReservation(reservationId: ReservationId) {
        this.reservations.delete(reservationId);
    }
}