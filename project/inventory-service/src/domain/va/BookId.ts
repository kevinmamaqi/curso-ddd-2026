import { DomainError } from "../errors";

export class BookId {
    constructor(private readonly value: string) {}

    static of(value: string) {
        if (value.length != 36) {
            throw new DomainError("The BookId must be a valid UUID");
        }
        return new BookId(value);
    }

    toValue() {
        return this.value;
    }

    toString(): string {
        return this.value;
    }
}
