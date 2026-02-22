import { IntegrationEvent, nowIso, ReleaseReservationRequestedEvent } from "../domain/events";
import { OrderId } from "../domain/value-objects";
import { OrderStatusProjector } from "./OrderStatusProjector";
import {
  FulfillmentOrderRepositoryPort,
  IntegrationEventPublisherPort,
  UnitOfWorkPort
} from "./ports";

export type CancelOrderCommand = Readonly<{
  orderId: string;
}>;

export class CancelOrderUseCase {
  constructor(
    private readonly repo: FulfillmentOrderRepositoryPort,
    private readonly events: IntegrationEventPublisherPort,
    private readonly orderStatusProjector: OrderStatusProjector,
    private readonly uow: UnitOfWorkPort
  ) {}

  async execute(cmd: CancelOrderCommand): Promise<void> {
    await this.uow.runInTransaction(async () => {
      const order = await this.repo.getById(OrderId.of(cmd.orderId));
      if (!order) throw new Error("Order not found");

      order.cancel();
      await this.repo.save(order);
      await this.orderStatusProjector.project(order);

      const reservationId = order.getReservationId();
      if (!reservationId) return;

      const releaseEvent: ReleaseReservationRequestedEvent = {
        type: "ReleaseReservationRequested",
        version: 1,
        occurredAt: nowIso(),
        payload: {
          reservationId,
          lines: order.getLinesSnapshot().map((l) => ({ sku: l.sku, qty: l.qty }))
        }
      };

      await this.events.publish(releaseEvent as IntegrationEvent<string, unknown>);
    });
  }
}

