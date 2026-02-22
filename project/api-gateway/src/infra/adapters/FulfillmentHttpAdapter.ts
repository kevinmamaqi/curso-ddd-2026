import {
  FulfillmentOrderView,
  FulfillmentServicePort,
  PickList,
  PlaceOrderInput
} from "../../application/ports/FulfillmentServicePort";
import { fetchJson } from "./http/httpClient";

export class FulfillmentHttpAdapter implements FulfillmentServicePort {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number
  ) {}

  async placeOrder(input: PlaceOrderInput, opts?: { correlationId?: string }): Promise<void> {
    const out = await fetchJson({
      baseUrl: this.baseUrl,
      path: `/orders`,
      method: "POST",
      timeoutMs: this.timeoutMs,
      body: input,
      headers: { "x-correlation-id": opts?.correlationId }
    });
    if (out.status >= 400) throw new Error("Fulfillment service error");
  }

  async getOrder(orderId: string, opts?: { correlationId?: string }): Promise<FulfillmentOrderView | null> {
    const out = await fetchJson({
      baseUrl: this.baseUrl,
      path: `/orders/${encodeURIComponent(orderId)}`,
      method: "GET",
      timeoutMs: this.timeoutMs,
      headers: { "x-correlation-id": opts?.correlationId }
    });
    if (out.status === 404) return null;
    if (out.status >= 400) throw new Error("Fulfillment service error");
    return out.body as FulfillmentOrderView;
  }

  async cancelOrder(orderId: string, opts?: { correlationId?: string }): Promise<void> {
    const out = await fetchJson({
      baseUrl: this.baseUrl,
      path: `/orders/${encodeURIComponent(orderId)}/cancel`,
      method: "POST",
      timeoutMs: this.timeoutMs,
      headers: { "x-correlation-id": opts?.correlationId }
    });
    if (out.status >= 400) throw new Error("Fulfillment service error");
  }

  async getPickList(orderId: string, opts?: { correlationId?: string }): Promise<PickList | null> {
    const out = await fetchJson({
      baseUrl: this.baseUrl,
      path: `/orders/${encodeURIComponent(orderId)}/pick-list`,
      method: "GET",
      timeoutMs: this.timeoutMs,
      headers: { "x-correlation-id": opts?.correlationId }
    });
    if (out.status === 404) return null;
    if (out.status >= 400) throw new Error("Fulfillment service error");
    return out.body as PickList;
  }
}

