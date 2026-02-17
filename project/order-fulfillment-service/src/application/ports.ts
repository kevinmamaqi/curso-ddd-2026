import { IntegrationEvent } from "../domain/events";
import { FulfillmentOrder } from "../domain/fulfillment-order";
import { OrderId } from "../domain/value-objects";

export interface FulfillmentOrderRepositoryPort {
  getById(id: OrderId): Promise<FulfillmentOrder | null>;
  save(order: FulfillmentOrder): Promise<void>;
}

export type ReserveStockRequest = Readonly<{
  reservationId: string;
  lines: Array<{ sku: string; qty: number }>;
}>;

export interface InventoryReservationsPort {
  requestReservation(request: ReserveStockRequest): Promise<void>;
}

export interface IntegrationEventPublisherPort {
  publish(event: IntegrationEvent<string, unknown>): Promise<void>;
}

