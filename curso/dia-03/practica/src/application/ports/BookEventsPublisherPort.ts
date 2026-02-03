export interface BookEventsPublisherPort {
    publish(eventName: string, payload: string): Promise<void>
}

