export type InventoryView = {
  sku: string
  available: number
  updatedAt: Date
}

export type InventoryViewListFilters = Readonly<{
  sku?: string
  onlyAvailable?: boolean
}>

export interface InventoryViewRepositoryPort {
  initSchema(): Promise<void>
  upsert(view: InventoryView): Promise<void>
  findBySku(sku: string): Promise<InventoryView | null>
  list(filters: InventoryViewListFilters): Promise<InventoryView[]>
}
