import { AppConfig } from "../../config/config";
import { InventoryReservationsPort, ReserveStockRequest } from "../../application/ports";

async function readResponseBody(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export class InventoryReservationsHttpAdapter implements InventoryReservationsPort {
  constructor(private readonly config: AppConfig) {}

  async requestReservation(request: ReserveStockRequest): Promise<void> {
    for (const line of request.lines) {
      const url = new URL(
        `/inventory/${encodeURIComponent(line.sku)}/reserve`,
        this.config.inventoryBaseUrl
      );

      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reservationId: request.reservationId,
          quantity: line.qty
        })
      });

      if (!res.ok) {
        const body = await readResponseBody(res);
        throw new Error(
          `Inventory reservation failed for ${line.sku}: ${res.status} ${res.statusText}${
            body ? ` - ${body}` : ""
          }`
        );
      }
    }
  }
}

