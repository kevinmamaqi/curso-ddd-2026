import { describe, expect, it } from "vitest";
import { PlaceOrderUseCase } from "./place-order-use-case";
import {
  FulfillmentOrderRepositoryPort,
  IntegrationEventPublisherPort,
  OrderStatusView,
  OrderStatusViewRepositoryPort,
  ReservationRouting,
  ReservationRoutingRepositoryPort,
  UnitOfWorkPort
} from "./ports";
import { FulfillmentOrder } from "../domain/fulfillment-order";
import { OrderId } from "../domain/value-objects";
import { IntegrationEvent } from "../domain/events";
import { OrderStatusProjector } from "./OrderStatusProjector";

class InMemoryRepo implements FulfillmentOrderRepositoryPort {
  private readonly items = new Map<string, FulfillmentOrder>();

  async getById(id: OrderId): Promise<FulfillmentOrder | null> {
    return this.items.get(id.toString()) ?? null;
  }

  async save(order: FulfillmentOrder): Promise<void> {
    this.items.set(order.id.toString(), order);
  }
}

class FakePublisher implements IntegrationEventPublisherPort {
  public events: IntegrationEvent<string, unknown>[] = [];

  async publish(event: IntegrationEvent<string, unknown>): Promise<void> {
    this.events.push(event);
  }
}

class InMemoryRoutingRepo implements ReservationRoutingRepositoryPort {
  public saved: ReservationRouting[] = [];
  private readonly items = new Map<string, ReservationRouting>();

  async save(routing: ReservationRouting): Promise<void> {
    this.saved.push(routing);
    this.items.set(routing.reservationId, routing);
  }

  async getByReservationId(reservationId: string): Promise<ReservationRouting | null> {
    return this.items.get(reservationId) ?? null;
  }
}

class InMemoryOrderStatusViewRepo implements OrderStatusViewRepositoryPort {
  public upserts: OrderStatusView[] = [];
  private readonly items = new Map<string, OrderStatusView>();

  async upsert(view: OrderStatusView): Promise<void> {
    this.upserts.push(view);
    this.items.set(view.orderId, view);
  }

  async getById(orderId: string): Promise<OrderStatusView | null> {
    return this.items.get(orderId) ?? null;
  }

  async listByStatus(status?: string): Promise<OrderStatusView[]> {
    const values = Array.from(this.items.values());
    return status ? values.filter((v) => v.status === status) : values;
  }
}

class FakeUow implements UnitOfWorkPort {
  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return await fn();
  }
}

describe("PlaceOrderUseCase", () => {
  it("places an order and publishes ReserveStockRequested", async () => {
    const repo = new InMemoryRepo();
    const routingRepo = new InMemoryRoutingRepo();
    const events = new FakePublisher();
    const orderStatusViewRepo = new InMemoryOrderStatusViewRepo();
    const orderStatusProjector = new OrderStatusProjector(orderStatusViewRepo);
    const uow = new FakeUow();

    const useCase = new PlaceOrderUseCase(
      repo,
      routingRepo,
      events,
      orderStatusProjector,
      uow
    );

    await useCase.execute({
      orderId: "ORDER-000001",
      reservationId: "RES-123",
      lines: [{ lineId: "LINE-0001", sku: "BOOK-0001", qty: 1 }]
    });

    expect(routingRepo.saved).toHaveLength(1);
    expect(routingRepo.saved[0].lineBySku).toEqual({ "BOOK-0001": "LINE-0001" });

    expect(events.events).toHaveLength(1);
    expect(events.events[0].type).toBe("ReserveStockRequested");

    const view = await orderStatusViewRepo.getById("ORDER-000001");
    expect(view?.status).toBe("RESERVATION_PENDING");
  });
});
