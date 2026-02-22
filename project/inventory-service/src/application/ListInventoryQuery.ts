import { InventoryViewRepositoryPort } from "./ports/InventoryViewRepositoryPort";

export type ListInventoryQueryInput = Readonly<{
  sku?: string;
  onlyAvailable?: boolean;
}>;

export type ListInventoryQueryItem = Readonly<{
  sku: string;
  available: number;
  updatedAt: string;
}>;

export class ListInventoryQuery {
  constructor(private readonly inventoryViewRepo: InventoryViewRepositoryPort) {}

  async execute(input: ListInventoryQueryInput): Promise<ListInventoryQueryItem[]> {
    const rows = await this.inventoryViewRepo.list({
      sku: input.sku,
      onlyAvailable: input.onlyAvailable
    });

    return rows.map((r) => ({
      sku: r.sku,
      available: r.available,
      updatedAt: r.updatedAt.toISOString()
    }));
  }
}

