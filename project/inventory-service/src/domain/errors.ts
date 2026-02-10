export class DomainError extends Error {
    readonly name = "DomainError";
    constructor(message: string) {
        super(message);
    }
}

export class InvalidQuantityError extends DomainError {
    constructor(message: string) {
        super(message);
    }
}

export class InvalidReservationIdError extends DomainError {
    constructor(message: string) {
        super(message);
    }
}