import { FulfillmentDomainEvents } from "./events";

export abstract class AggregateRoot {
    private readonly changes: FulfillmentDomainEvents[] = [];

    protected record(event: FulfillmentDomainEvents): void {
        this.changes.push(event)
    }

    pullDomainEvents(): FulfillmentDomainEvents[] {
        return this.changes.splice(0, this.changes.length);
    }
}