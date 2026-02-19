export interface InventoryIntegrationEventsPublisherPort {
  publishResultEvent(params: {
    reservationId: string;
    sku: string;
    kind: "reserved" | "rejected";
    qty?: number;
    reason?: string;
  }): Promise<void>;
}

