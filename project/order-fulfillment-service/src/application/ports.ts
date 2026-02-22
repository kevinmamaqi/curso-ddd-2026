import { IntegrationEvent } from "../domain/events";
import { FulfillmentOrder } from "../domain/fulfillment-order";
import { OrderId } from "../domain/value-objects";

export interface UnitOfWorkPort {
  runInTransaction<T>(fn: () => Promise<T>): Promise<T>;
}

export interface FulfillmentOrderRepositoryPort {
  getById(id: OrderId): Promise<FulfillmentOrder | null>;
  save(order: FulfillmentOrder): Promise<void>;
}

export interface IntegrationEventPublisherPort {
  publish(event: IntegrationEvent<string, unknown>): Promise<void>;
}

export type ReservationRouting = Readonly<{
  reservationId: string;
  orderId: string;
  lineBySku: Record<string, string>;
}>;

export interface ReservationRoutingRepositoryPort {
  save(routing: ReservationRouting): Promise<void>;
  getByReservationId(reservationId: string): Promise<ReservationRouting | null>;
}

export interface InboxRepositoryPort {
  tryAccept(messageId: string): Promise<boolean>;
}

export type OrderStatusView = Readonly<{
  orderId: string;
  status: string;
  reservationId?: string;
  updatedAt: string;
}>;

export interface OrderStatusViewRepositoryPort {
  upsert(view: OrderStatusView): Promise<void>;
  getById(orderId: string): Promise<OrderStatusView | null>;
  listByStatus(status?: string): Promise<OrderStatusView[]>;
}
