export type FulfillmentOrderView = Readonly<{
  orderId: string;
  status: string;
  reservationId?: string;
}>;

export type PlaceOrderInput = Readonly<{
  orderId: string;
  reservationId: string;
  lines: Array<{ lineId: string; sku: string; qty: number }>;
}>;

export type PickList = Readonly<{
  orderId: string;
  items: Array<{ lineId: string; sku: string; qty: number }>;
}>;

export interface FulfillmentServicePort {
  placeOrder(input: PlaceOrderInput, opts?: { correlationId?: string }): Promise<void>;
  getOrder(orderId: string, opts?: { correlationId?: string }): Promise<FulfillmentOrderView | null>;
  cancelOrder(orderId: string, opts?: { correlationId?: string }): Promise<void>;
  getPickList(orderId: string, opts?: { correlationId?: string }): Promise<PickList | null>;
}

