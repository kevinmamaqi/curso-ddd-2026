import { InventoryServicePort } from "../ports/InventoryServicePort";

export type ReplenishStockViaGatewayInput = Readonly<{
  sku: string;
  quantity: number;
}>;

export class ReplenishStockViaGatewayUseCase {
  constructor(private readonly inventory: InventoryServicePort) {}

  async execute(input: ReplenishStockViaGatewayInput, opts?: { correlationId?: string }): Promise<void> {
    if (!input.sku) throw new Error("sku is required");
    const qty = Number(input.quantity);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error("quantity must be > 0");
    await this.inventory.replenishStock({ sku: input.sku, qty }, opts);
  }
}

