import { FulfillmentOrder } from "../domain/fulfillment-order";
import { nowIso, IntegrationEvent } from "../domain/events";
import { LineId, OrderId, Quantity, Sku } from "../domain/value-objects";
import {
  FulfillmentOrderRepositoryPort,
  IntegrationEventPublisherPort,
  ReservationRoutingRepositoryPort,
  UnitOfWorkPort
} from "./ports";
import { OrderStatusProjector } from "./OrderStatusProjector";

export type PlaceOrderCommand = Readonly<{
  orderId: string;
  reservationId: string;
  lines: Array<{ lineId: string; sku: string; qty: number }>;
}>;

export class PlaceOrderUseCase {
  constructor(
    private readonly repo: FulfillmentOrderRepositoryPort,
    private readonly routingRepo: ReservationRoutingRepositoryPort,
    private readonly events: IntegrationEventPublisherPort,
    private readonly orderStatusProjector: OrderStatusProjector,
    private readonly uow: UnitOfWorkPort
  ) {}

  async execute(cmd: PlaceOrderCommand): Promise<void> {
    await this.uow.runInTransaction(async () => {
      const order = FulfillmentOrder.place({
        orderId: OrderId.of(cmd.orderId),
        lines: cmd.lines.map((l) => ({
          lineId: LineId.of(l.lineId),
          sku: Sku.of(l.sku),
          qty: Quantity.of(l.qty)
        }))
      });

      order.requestReservation(cmd.reservationId);
      await this.repo.save(order);

      await this.routingRepo.save({
        reservationId: cmd.reservationId,
        orderId: cmd.orderId,
        lineBySku: Object.fromEntries(cmd.lines.map((l) => [l.sku, l.lineId]))
      });

      await this.orderStatusProjector.project(order);

      const reserveEvent: IntegrationEvent<
        "ReserveStockRequested",
        { reservationId: string; lines: Array<{ sku: string; qty: number }> }
      > = {
        type: "ReserveStockRequested",
        version: 1,
        occurredAt: nowIso(),
        payload: {
          reservationId: cmd.reservationId,
          lines: cmd.lines.map((l) => ({ sku: l.sku, qty: l.qty }))
        }
      };

      await this.events.publish(reserveEvent);
    });
  }
}
