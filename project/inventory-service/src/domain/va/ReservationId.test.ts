import { describe, expect, it } from "vitest";
import { ReservationId } from "./ReservationId";
import { DomainError } from "../errors";

describe("ReservationId", () => {
  it("should create a valid ReservationId (UUID)", () => {
    const reservationId = ReservationId.of("3ed25e01-f3a3-4846-b382-c0d1fcb200bb");
    expect(reservationId).toBeDefined();
    expect(reservationId.toValue()).toBe("3ed25e01-f3a3-4846-b382-c0d1fcb200bb");
  });

  it("should create a valid ReservationId (human-readable id)", () => {
    const reservationId = ReservationId.of("RES-ORDER-000001");
    expect(reservationId.toValue()).toBe("RES-ORDER-000001");
  });

  it("should throw an error if ReservationId is empty", () => {
    expect(() => ReservationId.of("")).toThrow(DomainError);
  });

  it("should throw an error if ReservationId contains whitespace", () => {
    expect(() => ReservationId.of("RES ORDER 000001")).toThrow(DomainError);
  });
});
