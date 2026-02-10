import { describe, expect, it } from "vitest";
import { ReservationId } from "./ReservationId";
import { DomainError } from "../errors";

describe("ReservationId", ()=> {
    it("should create a valid ReservationId", () => {
        const reservationId = ReservationId.of("3ed25e01-f3a3-4846-b382-c0d1fcb200bb");
        expect(reservationId).toBeDefined();
        expect(reservationId.toValue()).toBe("3ed25e01-f3a3-4846-b382-c0d1fcb200bb");
    });

    it("should throw an error if the ReservationId is not a valid UUID", () => {
        expect(() => ReservationId.of("1234567890")).toThrow(DomainError);
    });
});