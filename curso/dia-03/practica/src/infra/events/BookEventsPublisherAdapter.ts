import { BookEventsPublisherPort } from "../../application/ports/BookEventsPublisherPort";

enum EventVersion {
    "v1", 
    "v2"
} 

export class BookEventsPublisher implements BookEventsPublisherPort{
    private eventsArray: any[]
    public version: EventVersion = EventVersion.v1
    public epoch: number

    constructor(version = EventVersion.v1) {
        this.version = version;
        this.epoch = Date.now();
    }

    async publish(eventName: string, payload: string): Promise<void> {
        const event = {
            version: this.version,
            name: eventName,
            payload: payload,
            timestamp: this.epoch
        }
        this.eventsArray.push(event)
    }
}