import { FulfillmentServicePort, PlaceOrderInput } from "../ports/FulfillmentServicePort";

export class PlaceOrderViaGatewayUseCase {
  constructor(private readonly fulfillment: FulfillmentServicePort) {}

  async execute(input: PlaceOrderInput, opts?: { correlationId?: string }): Promise<void> {
    if (!input.orderId) throw new Error("orderId is required");
    if (!input.reservationId) throw new Error("reservationId is required");
    if (!Array.isArray(input.lines) || input.lines.length === 0) {
      throw new Error("lines must be a non-empty array");
    }
    for (const l of input.lines) {
      if (!l.lineId || !l.sku || !Number.isFinite(l.qty) || l.qty <= 0) {
        throw new Error("Invalid line");
      }
    }

    await this.fulfillment.placeOrder(input, opts);
  }
}

