import {
  InventoryView,
  InventoryViewListFilters,
  InventoryViewRepositoryPort,
} from "../../application/ports/InventoryViewRepositoryPort"

export class InventoryViewRepositoryInMemory implements InventoryViewRepositoryPort {
  private readonly views = new Map<string, InventoryView>()

  async initSchema(): Promise<void> {}

  async upsert(view: InventoryView): Promise<void> {
    this.views.set(view.sku, view)
  }

  async findBySku(sku: string): Promise<InventoryView | null> {
    return this.views.get(sku) ?? null
  }

  async list(filters: InventoryViewListFilters): Promise<InventoryView[]> {
    let out = Array.from(this.views.values())
    if (filters.sku) {
      out = out.filter((v) => v.sku === filters.sku)
    }
    if (filters.onlyAvailable) {
      out = out.filter((v) => v.available > 0)
    }
    return out
  }
}
