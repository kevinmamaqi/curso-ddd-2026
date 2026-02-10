import { describe, expect, it } from "vitest";
import { Quantity } from "./Quantity";
import { InvalidQuantityError } from "../errors";


describe("Quantity", ()=> {
    it("should create a valid Quantity", () => {
        const quantity = Quantity.of(10);
        expect(quantity).toBeDefined();
        expect(quantity.toValue()).toBe(10);
    });

    it("should throw an error if the Quantity is not a positive integer", () => {
        expect(() => Quantity.of(-1)).toThrow(InvalidQuantityError);
    });
});