import { InventoryServicePort } from "../ports/InventoryServicePort";

export type ReleaseReservationViaGatewayInput = Readonly<{
  sku: string;
  reservationId: string;
}>;

export class ReleaseReservationViaGatewayUseCase {
  constructor(private readonly inventory: InventoryServicePort) {}

  async execute(input: ReleaseReservationViaGatewayInput, opts?: { correlationId?: string }): Promise<void> {
    if (!input.sku) throw new Error("sku is required");
    if (!input.reservationId) throw new Error("reservationId is required");
    await this.inventory.releaseReservation({ sku: input.sku, reservationId: input.reservationId }, opts);
  }
}

