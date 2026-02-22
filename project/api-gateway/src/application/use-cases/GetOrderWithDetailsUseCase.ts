import { FulfillmentServicePort } from "../ports/FulfillmentServicePort";
import { InventoryServicePort } from "../ports/InventoryServicePort";

export class GetOrderWithDetailsUseCase {
  constructor(
    private readonly fulfillment: FulfillmentServicePort,
    private readonly inventory: InventoryServicePort
  ) {}

  async execute(orderId: string, opts?: { correlationId?: string }) {
    const order = await this.fulfillment.getOrder(orderId, opts);
    if (!order) return null;

    const pickList = await this.fulfillment.getPickList(orderId, opts);
    const skus = Array.from(new Set((pickList?.items ?? []).map((i) => i.sku)));

    const stocks = await Promise.all(
      skus.map(async (sku) => ({
        sku,
        stock: await this.inventory.getStock(sku, opts)
      }))
    );

    return {
      order,
      pickList,
      inventory: {
        items: stocks
      }
    };
  }
}

