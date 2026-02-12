import { FulfillmentOrder } from "../domain/fullfillment-order";
import { FulfillmentOrderRepository, IntegrationEventPublisherPort } from "./ports";


export class PlaceOrderUseCase {
    constructor(
        private readonly repo: FulfillmentOrderRepository,
        private readonly eventPublisher: IntegrationEventPublisherPort,
    ) {}

    async execute(orderId: number, lineCount: number): Promise<void> {
        const order = FulfillmentOrder.place(orderId, lineCount)
        await this.repo.save(order)
        await this.eventPublisher.publish(order.pullDomainEvents()[0])
    }
}