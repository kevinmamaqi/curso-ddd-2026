import { OrderStatusViewRepositoryPort } from "./ports";

export type ListOrdersByStatusQueryInput = Readonly<{
  status?: string;
}>;

export class ListOrdersByStatusQuery {
  constructor(private readonly orderStatusViewRepo: OrderStatusViewRepositoryPort) {}

  async execute(input: ListOrdersByStatusQueryInput) {
    const rows = await this.orderStatusViewRepo.listByStatus(input.status);
    return { items: rows };
  }
}

