import { DomainError } from "../errors";

export class ReservationId {
    constructor(private readonly value: string) {}

    static of(value: string): ReservationId {
        if (value.length !== 36) {
            throw new DomainError("The ReservationId must be a valid UUID");
        }
        return new ReservationId(value);
    }

    toValue(): string {
        return this.value;
    }

    toString(): string {
        return this.value;
    }
}
