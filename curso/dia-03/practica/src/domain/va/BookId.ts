export class BookId {
    constructor(private readonly value: string) {}

    static of(value: string) {
        if (value.length != 32) {
            throw new Error("The BookId must be 32 characters");
        }
        return new BookId(value);
    }

    toValue() {
        return this.value;
    }
}