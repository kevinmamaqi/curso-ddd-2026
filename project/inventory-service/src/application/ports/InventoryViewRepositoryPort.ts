export type InventoryView = {
  sku: string
  available: number
  updatedAt: Date
}

export interface InventoryViewRepositoryPort {
  initSchema(): Promise<void>
  upsert(view: InventoryView): Promise<void>
  findBySku(sku: string): Promise<InventoryView | null>
}

