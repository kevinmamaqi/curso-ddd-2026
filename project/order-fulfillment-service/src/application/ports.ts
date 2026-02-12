import { FulfillmentDomainEvents } from "../domain/events"
import { FulfillmentOrder } from "../domain/fullfillment-order"

type Line = {
    qty: number
    sku: string
    lineId: string
}

export type ReserveStockRequest = {
    reservationId: string
    lines: Line[]
}

export interface InventoryReservationsPort {
    requestReservation(request: ReserveStockRequest): Promise<void>
}

export interface FulfillmentOrderRepository {
    save(order: FulfillmentOrder): Promise<void>
    findById(orderId: number): Promise<FulfillmentOrder | null>
}

export interface IntegrationEventPublisherPort {
    publish(event: FulfillmentDomainEvents): Promise<void>
}