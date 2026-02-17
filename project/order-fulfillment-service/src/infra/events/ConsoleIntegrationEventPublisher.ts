import { IntegrationEventPublisherPort } from "../../application/ports";
import { IntegrationEvent } from "../../domain/events";

export class ConsoleIntegrationEventPublisher implements IntegrationEventPublisherPort {
  async publish(event: IntegrationEvent<string, unknown>): Promise<void> {
    console.log(JSON.stringify({ kind: "integration-event", event }));
  }
}

