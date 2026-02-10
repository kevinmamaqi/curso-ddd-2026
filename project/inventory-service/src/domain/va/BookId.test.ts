import { describe, expect, it } from "vitest";
import { BookId } from "./BookId";
import { DomainError } from "../errors";

describe("BookId", ()=> {
    it("should create a valid BookId", () => {
        const bookId = BookId.of("3ed25e01-f3a3-4846-b382-c0d1fcb200bb");
        expect(bookId).toBeDefined();
        expect(bookId.toValue()).toBe("3ed25e01-f3a3-4846-b382-c0d1fcb200bb");
    });

    it("should throw an error if the BookId is not a valid UUID", () => {
        expect(() => BookId.of("1234567890")).toThrow(DomainError);
    });
})