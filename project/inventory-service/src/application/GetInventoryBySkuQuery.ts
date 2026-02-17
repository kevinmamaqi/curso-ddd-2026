import { InventoryViewRepositoryPort } from "./ports/InventoryViewRepositoryPort"

export type GetInventoryBySkuQueryInput = {
  sku: string
}

export type GetInventoryBySkuQueryResult = {
  sku: string
  available: number
  updatedAt: string
}

export class GetInventoryBySkuQuery {
  constructor(private readonly inventoryViewRepo: InventoryViewRepositoryPort) {}

  async execute(input: GetInventoryBySkuQueryInput): Promise<GetInventoryBySkuQueryResult | null> {
    const view = await this.inventoryViewRepo.findBySku(input.sku)
    if (!view) return null

    return {
      sku: view.sku,
      available: view.available,
      updatedAt: view.updatedAt.toISOString(),
    }
  }
}
