import { InvalidReservationIdError } from "../errors";
import { InventoryDomainEvent } from "../events";
import { BookId } from "../va/BookId";
import { Quantity } from "../va/Quantity";
import { ReservationId } from "../va/ReservationId";

export class Book {
    readonly id: BookId;
    public title: string;
    public stock: number;
    private pendingDomainEvents: InventoryDomainEvent[] = [];
    private readonly reservations: Map<ReservationId, number> = new Map();

    constructor(id: BookId, title: string, stock: number) {
        this.id = id;
        this.title = title;
        this.stock = stock;
    }

    reserve(reservationId: ReservationId, qty: Quantity) {
        if (this.reservations.has(reservationId)) {
            throw new InvalidReservationIdError(`The reservationId ${reservationId.toString()} already exists`);
        }
        if (this.stock < qty.toValue()) {
            throw new Error("Not enough stock")
        }

        this.reservations.set(reservationId, qty.toValue());
        this.stock = this.stock - qty.toValue();

        this.pendingDomainEvents.push({
            type: "StockReserved",
            occurredAt: new Date(),
            payload: {
                sku: this.id.toValue(),
                reservationId: reservationId.toValue(),
                quantity: qty.toValue(),
                available: this.stock,
            },
        });
    }

    replenish(qty: Quantity) {
        this.stock = this.stock + qty.toValue();
        this.pendingDomainEvents.push({
            type: "StockReplenished",
            occurredAt: new Date(),
            payload: {
                sku: this.id.toValue(),
                quantity: qty.toValue(),
                available: this.stock,
            },
        });
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

    pullDomainEvents(): InventoryDomainEvent[] {
        return this.pendingDomainEvents.splice(0, this.pendingDomainEvents.length);
    }
}
