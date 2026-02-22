export type IsoDateString = string;

export type DomainEvent<TType extends string, TPayload> = Readonly<{
  type: TType;
  occurredAt: IsoDateString;
  payload: TPayload;
}>;

export type FulfillmentDomainEvents =
  | DomainEvent<
      "FulfillmentOrderPlaced",
      { orderId: string; lineCount: number }
    >
  | DomainEvent<
      "ReservationRequested",
      { orderId: string; reservationId: string; lines: Array<{ lineId: string; sku: string; qty: number }> }
    >
  | DomainEvent<
      "ReservationConfirmed",
      { orderId: string; lineId: string; sku: string; qty: number }
    >
  | DomainEvent<
      "ReservationRejected",
      { orderId: string; lineId: string; sku: string; reason: string }
    >
  | DomainEvent<
      "FulfillmentOrderReadyToShip",
      { orderId: string }
    >
  | DomainEvent<
      "OrderCancelled",
      { orderId: string; reservationId?: string }
    >
  | DomainEvent<
      "PickListGenerated",
      { orderId: string; lineCount: number }
    >;

export type IntegrationEvent<TType extends string, TPayload> = Readonly<{
  type: TType;
  version: 1 | 2;
  occurredAt: IsoDateString;
  payload: TPayload;
}>;

export type IntegrationMessage<TEvent extends IntegrationEvent<string, unknown>> = Readonly<{
  messageId: string;
  correlationId: string;
  event: TEvent;
}>;

export type InventoryIntegrationEvents =
  | IntegrationEvent<
      "StockReserved",
      { reservationId: string; sku: string; qty: number }
    >
  | IntegrationEvent<
      "StockReservationRejected",
      { reservationId: string; sku: string; reason: string }
    >;

export type ReleaseReservationRequestedEvent = IntegrationEvent<
  "ReleaseReservationRequested",
  { reservationId: string; lines: Array<{ sku: string; qty: number }> }
>;

export function nowIso(): IsoDateString {
  return new Date().toISOString();
}
