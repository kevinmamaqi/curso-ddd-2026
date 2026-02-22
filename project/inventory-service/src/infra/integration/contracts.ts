export type IsoDateString = string;

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

export type ReserveStockRequestedEvent = IntegrationEvent<
  "ReserveStockRequested",
  { reservationId: string; lines: Array<{ sku: string; qty: number }> }
>;

export type ReleaseReservationRequestedEvent = IntegrationEvent<
  "ReleaseReservationRequested",
  { reservationId: string; lines: Array<{ sku: string; qty: number }> }
>;

export type StockReservedEvent = IntegrationEvent<
  "StockReserved",
  { reservationId: string; sku: string; qty: number }
>;

export type StockReservationRejectedEvent = IntegrationEvent<
  "StockReservationRejected",
  { reservationId: string; sku: string; reason: string }
>;

export type InventoryResultEvent = StockReservedEvent | StockReservationRejectedEvent;

export function nowIso(): IsoDateString {
  return new Date().toISOString();
}
