export class FulfillmentOrderStatus {
    static readonly DRAFT = new FulfillmentOrderStatus("DRAFT")
    static readonly RESERVATION_REQUESTED = new FulfillmentOrderStatus("RESERVATION_REQUESTED")
    static readonly RESERVATION_CONFIRMED = new FulfillmentOrderStatus("RESERVATION_CONFIRMED")
    static readonly RESERVATION_REJECTED = new FulfillmentOrderStatus("RESERVATION_REJECTED")
    static readonly READY_TO_SHIP = new FulfillmentOrderStatus("READY_TO_SHIP")
    static readonly SHIPPED = new FulfillmentOrderStatus("SHIPPED")
    static readonly CANCELLED = new FulfillmentOrderStatus("CANCELLED")

    private constructor(private readonly value: string) {
        if (!Object.values(FulfillmentOrderStatus).map(status => status.toValue()).includes(value)) {
            throw new Error(`Invalid fulfillment order status: ${value}`)
        }
    }

    toValue(): string {
        return this.value
    }

    static fromString(value: string): FulfillmentOrderStatus {
        return Object.values(FulfillmentOrderStatus).find(status => status.toValue() === value) || FulfillmentOrderStatus.DRAFT
    }
}