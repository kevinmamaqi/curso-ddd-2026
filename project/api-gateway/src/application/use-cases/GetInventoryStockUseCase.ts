import { InventoryServicePort } from "../ports/InventoryServicePort";

export class GetInventoryStockUseCase {
  constructor(private readonly inventory: InventoryServicePort) {}

  async execute(sku: string, opts?: { correlationId?: string }) {
    if (!sku) throw new Error("sku is required");
    return await this.inventory.getStock(sku, opts);
  }
}

