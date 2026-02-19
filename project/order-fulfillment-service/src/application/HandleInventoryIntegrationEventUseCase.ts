import { InventoryAclTranslator } from "./acl-inventory-translator";
import {
  FulfillmentOrderRepositoryPort,
  InboxRepositoryPort,
  ReservationRoutingRepositoryPort
} from "./ports";
import { InventoryIntegrationEvents, IntegrationMessage } from "../domain/events";
import { LineId, Quantity, Sku, OrderId } from "../domain/value-objects";
import { OrderStatusProjector } from "./OrderStatusProjector";

export class HandleInventoryIntegrationEventUseCase {
  constructor(
    private readonly repo: FulfillmentOrderRepositoryPort,
    private readonly routingRepo: ReservationRoutingRepositoryPort,
    private readonly inboxRepo: InboxRepositoryPort,
    private readonly orderStatusProjector: OrderStatusProjector
  ) {}

  async execute(msg: IntegrationMessage<InventoryIntegrationEvents>): Promise<void> {
    const accepted = await this.inboxRepo.tryAccept(msg.messageId);
    if (!accepted) return;

    const reservationId = msg.event.payload.reservationId;
    const routing = await this.routingRepo.getByReservationId(reservationId);
    if (!routing) {
      throw new Error(`No routing found for reservationId=${reservationId}`);
    }

    const translator = new InventoryAclTranslator(routing.lineBySku);
    const decision = translator.translate(msg.event);

    const order = await this.repo.getById(OrderId.of(routing.orderId));
    if (!order) {
      throw new Error(`Order not found: ${routing.orderId}`);
    }

    if (decision.kind === "confirmed") {
      order.confirmLineReservation({
        lineId: LineId.of(decision.lineId.toString()),
        sku: Sku.of(decision.sku.toString()),
        qty: Quantity.of(decision.qty.toNumber())
      });
    } else {
      order.rejectLineReservation({
        lineId: LineId.of(decision.lineId.toString()),
        sku: Sku.of(decision.sku.toString()),
        reason: decision.reason
      });
    }

    await this.repo.save(order);
    await this.orderStatusProjector.project(order);
  }
}

