import { AggregateRoot } from "./aggregate-root";
import { FulfillmentOrderStatus } from "./va";

export class FulfillmentOrderLine {
    private readonly id: string
    private readonly quantity: number
    private readonly sku: string
}

export class FulfillmentOrder extends AggregateRoot {
    private readonly orderId: number
    private status: FulfillmentOrderStatus = FulfillmentOrderStatus.DRAFT
    private readonly lines: FulfillmentOrderLine[] = []
    private readonly reservationId: string | null = null

    static place(orderId: number, lineCount: number): FulfillmentOrder {
        const order = new FulfillmentOrder()
        order.orderId = orderId
        order.lines = Array.from({ length: lineCount }, (_, index) => new FulfillmentOrderLine(index.toString(), 1, `SKU-${index + 1}`))
        order.record({
            type: "FulfillmentOrderPlacedDomainEvent",
            ocurredAt: new Date().toISOString(),
            payload: {
                orderId: orderId,
                lineCount: lineCount
            }
        })
        return order
    }


    markAsReadyToShip(): void {
        if (this.status !== FulfillmentOrderStatus.RESERVATION_CONFIRMED) {
            throw new Error("Fulfillment order must be confirmed before being ready to ship")
        }
        this.status = FulfillmentOrderStatus.READY_TO_SHIP
        this.record({
            type: "FulfillmentOrderReadyToShipDomainEvent",
            ocurredAt: new Date().toISOString(),
            payload: {
                orderId: this.orderId
            }
        })
    }
}