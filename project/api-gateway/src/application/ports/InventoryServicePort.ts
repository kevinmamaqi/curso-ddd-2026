export type InventoryStockView = Readonly<{
  sku: string;
  available: number;
  updatedAt?: string;
}>;

export interface InventoryServicePort {
  getStock(sku: string, opts?: { correlationId?: string }): Promise<InventoryStockView | null>;
  reserveStock(
    params: { sku: string; reservationId: string; qty: number },
    opts?: { correlationId?: string }
  ): Promise<void>;
  releaseReservation(
    params: { sku: string; reservationId: string },
    opts?: { correlationId?: string }
  ): Promise<void>;
  replenishStock(params: { sku: string; qty: number }, opts?: { correlationId?: string }): Promise<void>;
}

