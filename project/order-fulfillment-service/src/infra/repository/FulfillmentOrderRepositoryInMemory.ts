import { FulfillmentOrderRepositoryPort } from "../../application/ports";
import { FulfillmentOrder } from "../../domain/fulfillment-order";
import { OrderId } from "../../domain/value-objects";

export class FulfillmentOrderRepositoryInMemory implements FulfillmentOrderRepositoryPort {
  private readonly items = new Map<string, FulfillmentOrder>();

  async getById(id: OrderId): Promise<FulfillmentOrder | null> {
    return this.items.get(id.toString()) ?? null;
  }

  async save(order: FulfillmentOrder): Promise<void> {
    this.items.set(order.id.toString(), order);
  }
}

