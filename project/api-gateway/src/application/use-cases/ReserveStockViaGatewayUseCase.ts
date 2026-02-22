import { InventoryServicePort } from "../ports/InventoryServicePort";

export type ReserveStockViaGatewayInput = Readonly<{
  sku: string;
  reservationId: string;
  quantity: number;
}>;

export class ReserveStockViaGatewayUseCase {
  constructor(private readonly inventory: InventoryServicePort) {}

  async execute(input: ReserveStockViaGatewayInput, opts?: { correlationId?: string }): Promise<void> {
    if (!input.sku) throw new Error("sku is required");
    if (!input.reservationId) throw new Error("reservationId is required");
    const qty = Number(input.quantity);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error("quantity must be > 0");

    await this.inventory.reserveStock(
      { sku: input.sku, reservationId: input.reservationId, qty },
      opts
    );
  }
}

