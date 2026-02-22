export type StockReservedEvent = {
  type: 'StockReserved'
  occurredAt: Date
  payload: {
    sku: string
    reservationId: string
    quantity: number
    available: number
  }
}

export type StockReplenishedEvent = {
  type: 'StockReplenished'
  occurredAt: Date
  payload: {
    sku: string
    quantity: number
    available: number
  }
}

export type ReservationReleasedEvent = {
  type: "ReservationReleased";
  occurredAt: Date;
  payload: {
    sku: string;
    reservationId: string;
    quantity: number;
    available: number;
  };
};

export type InventoryDomainEvent =
  | StockReservedEvent
  | StockReplenishedEvent
  | ReservationReleasedEvent
