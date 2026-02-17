import { describe, expect, it } from "vitest";
import { PlaceOrderUseCase } from "./place-order-use-case";
import {
  FulfillmentOrderRepositoryPort,
  IntegrationEventPublisherPort,
  InventoryReservationsPort,
  ReserveStockRequest
} from "./ports";
import { FulfillmentOrder } from "../domain/fulfillment-order";
import { OrderId } from "../domain/value-objects";
import { IntegrationEvent } from "../domain/events";

class InMemoryRepo implements FulfillmentOrderRepositoryPort {
  private readonly items = new Map<string, FulfillmentOrder>();

  async getById(id: OrderId): Promise<FulfillmentOrder | null> {
    return this.items.get(id.toString()) ?? null;
  }

  async save(order: FulfillmentOrder): Promise<void> {
    this.items.set(order.id.toString(), order);
  }
}

class FakeInventory implements InventoryReservationsPort {
  public calls: ReserveStockRequest[] = [];

  async requestReservation(request: ReserveStockRequest): Promise<void> {
    this.calls.push(request);
  }
}

class FakePublisher implements IntegrationEventPublisherPort {
  public events: IntegrationEvent<string, unknown>[] = [];

  async publish(event: IntegrationEvent<string, unknown>): Promise<void> {
    this.events.push(event);
  }
}

describe("PlaceOrderUseCase", () => {
  it("places an order and requests stock reservation", async () => {
    const repo = new InMemoryRepo();
    const inventory = new FakeInventory();
    const events = new FakePublisher();

    const useCase = new PlaceOrderUseCase(repo, inventory, events);

    await useCase.execute({
      orderId: "ORDER-000001",
      reservationId: "RES-123",
      lines: [{ lineId: "LINE-0001", sku: "BOOK-0001", qty: 1 }]
    });

    expect(inventory.calls).toHaveLength(1);
    expect(inventory.calls[0]).toEqual({
      reservationId: "RES-123",
      lines: [{ sku: "BOOK-0001", qty: 1 }]
    });

    expect(events.events).toHaveLength(1);
    expect(events.events[0].type).toBe("ReserveStockRequested");
  });
});

