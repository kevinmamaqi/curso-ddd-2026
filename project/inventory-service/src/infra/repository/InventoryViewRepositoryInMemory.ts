import { InventoryView, InventoryViewRepositoryPort } from "../../application/ports/InventoryViewRepositoryPort"

export class InventoryViewRepositoryInMemory implements InventoryViewRepositoryPort {
  private readonly views = new Map<string, InventoryView>()

  async initSchema(): Promise<void> {}

  async upsert(view: InventoryView): Promise<void> {
    this.views.set(view.sku, view)
  }

  async findBySku(sku: string): Promise<InventoryView | null> {
    return this.views.get(sku) ?? null
  }
}

