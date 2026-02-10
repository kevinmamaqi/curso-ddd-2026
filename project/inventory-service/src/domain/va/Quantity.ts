import { InvalidQuantityError } from "../errors";

export class Quantity {
    private constructor (private readonly value: number) {}

    static of(value: number): Quantity {
        if (!Number.isInteger(value) || value <= 0) {
            throw new InvalidQuantityError("The quantity must be a positive integer and equal or greater than 0");
        }
        return new Quantity(value);
    }

    toValue(): number {
        return this.value;
    }
}