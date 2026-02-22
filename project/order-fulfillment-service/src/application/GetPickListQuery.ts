import { OrderId } from "../domain/value-objects";
import { FulfillmentOrderRepositoryPort } from "./ports";

export type GetPickListQueryInput = Readonly<{ orderId: string }>;

export class GetPickListQuery {
  constructor(private readonly repo: FulfillmentOrderRepositoryPort) {}

  async execute(input: GetPickListQueryInput): Promise<{ orderId: string; items: any[] } | null> {
    const order = await this.repo.getById(OrderId.of(input.orderId));
    if (!order) return null;
    return { orderId: order.id.toString(), items: order.getPickList() };
  }
}

