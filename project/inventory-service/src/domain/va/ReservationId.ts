import { DomainError } from "../errors";

export class ReservationId {
    constructor(private readonly value: string) {}

    static of(value: string): ReservationId {
        const v = String(value ?? "");
        if (!v) {
            throw new DomainError("ReservationId is required");
        }
        // In this course repo, `reservationId` is a cross-service idempotency key.
        // It’s commonly a UUID, but we also accept stable string IDs like `RES-000001`
        // or `RES-ORDER-000123` to keep demos simple.
        if (v.length > 200) {
            throw new DomainError("ReservationId is too long (max 200 chars)");
        }
        if (/\s/.test(v)) {
            throw new DomainError("ReservationId must not contain whitespace");
        }
        return new ReservationId(v);
    }

    toValue(): string {
        return this.value;
    }

    toString(): string {
        return this.value;
    }
}
