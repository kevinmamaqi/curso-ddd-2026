import { FulfillmentOrder } from "../domain/fulfillment-order";
import { nowIso } from "../domain/events";
import { OrderStatusViewRepositoryPort } from "./ports";

export class OrderStatusProjector {
  constructor(private readonly orderStatusViewRepo: OrderStatusViewRepositoryPort) {}

  async project(order: FulfillmentOrder): Promise<void> {
    await this.orderStatusViewRepo.upsert({
      orderId: order.id.toString(),
      status: order.getStatus(),
      reservationId: order.getReservationId(),
      updatedAt: nowIso()
    });
  }
}

