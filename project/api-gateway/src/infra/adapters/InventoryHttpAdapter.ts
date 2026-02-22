import { InventoryServicePort, InventoryStockView } from "../../application/ports/InventoryServicePort";
import { fetchJson } from "./http/httpClient";

export class InventoryHttpAdapter implements InventoryServicePort {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number
  ) {}

  async getStock(sku: string, opts?: { correlationId?: string }): Promise<InventoryStockView | null> {
    const out = await fetchJson({
      baseUrl: this.baseUrl,
      path: `/inventory/${encodeURIComponent(sku)}`,
      method: "GET",
      timeoutMs: this.timeoutMs,
      headers: { "x-correlation-id": opts?.correlationId }
    });

    if (out.status === 404) return null;
    if (out.status >= 400) throw new Error("Inventory service error");
    return out.body as InventoryStockView;
  }

  async reserveStock(
    params: { sku: string; reservationId: string; qty: number },
    opts?: { correlationId?: string }
  ): Promise<void> {
    const out = await fetchJson({
      baseUrl: this.baseUrl,
      path: `/inventory/${encodeURIComponent(params.sku)}/reserve`,
      method: "POST",
      timeoutMs: this.timeoutMs,
      body: { reservationId: params.reservationId, quantity: params.qty },
      headers: { "x-correlation-id": opts?.correlationId }
    });
    if (out.status >= 400) throw new Error("Inventory service error");
  }

  async releaseReservation(
    params: { sku: string; reservationId: string },
    opts?: { correlationId?: string }
  ): Promise<void> {
    const out = await fetchJson({
      baseUrl: this.baseUrl,
      path: `/inventory/${encodeURIComponent(params.sku)}/release`,
      method: "POST",
      timeoutMs: this.timeoutMs,
      body: { reservationId: params.reservationId },
      headers: { "x-correlation-id": opts?.correlationId }
    });
    if (out.status >= 400) throw new Error("Inventory service error");
  }

  async replenishStock(
    params: { sku: string; qty: number },
    opts?: { correlationId?: string }
  ): Promise<void> {
    const out = await fetchJson({
      baseUrl: this.baseUrl,
      path: `/inventory/${encodeURIComponent(params.sku)}/replenish`,
      method: "POST",
      timeoutMs: this.timeoutMs,
      body: { quantity: params.qty },
      headers: { "x-correlation-id": opts?.correlationId }
    });
    if (out.status >= 400) throw new Error("Inventory service error");
  }
}

