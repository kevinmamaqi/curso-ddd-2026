import { InventoryDomainEvent } from "../domain/events"
import { InventoryViewRepositoryPort } from "./ports/InventoryViewRepositoryPort"

export class InventoryViewProjector {
  constructor(private readonly inventoryViewRepo: InventoryViewRepositoryPort) {}

  async project(events: InventoryDomainEvent[]): Promise<void> {
    for (const event of events) {
      switch (event.type) {
        case "StockReserved": {
          await this.inventoryViewRepo.upsert({
            sku: event.payload.sku,
            available: event.payload.available,
            updatedAt: event.occurredAt,
          })
          break
        }
        case "StockReplenished": {
          await this.inventoryViewRepo.upsert({
            sku: event.payload.sku,
            available: event.payload.available,
            updatedAt: event.occurredAt,
          })
          break
        }
        default: {
          const _exhaustiveCheck: never = event
          throw new Error(`Unsupported inventory event: ${String(_exhaustiveCheck)}`)
        }
      }
    }
  }
}
