export type IsoDateString = string

export type DomainEvent<TType extends string, TPayload> = Readonly<{
    type: TType,
    ocurredAt: IsoDateString
    payload: TPayload
}>

// - `FulfillmentOrderPlaced`
// - `ReservationRequested`
// - `ReservationConfirmed`
// - `ReservationRejected`
// - `FulfillmentOrderReadyToShip`

export type FulfillmentDomainEvents = 
    | DomainEvent<'FulfillmentOrderPlacedDomainEvent', {orderId: number, lineCount: number}>
    | DomainEvent<'ReservationRequestedDomainEvent', {orderId: number, reservationId: string, lines: Array<{qty: number, sku: string, lineId: string}>}>
    | DomainEvent<'ReservationConfirmedDomainEvent', {orderId: number, reservationId: string}>
    | DomainEvent<'ReservationRejectedDomainEvent', {orderId: number, reservationId: string}>
    | DomainEvent<'FulfillmentOrderReadyToShipDomainEvent', {orderId: number}>