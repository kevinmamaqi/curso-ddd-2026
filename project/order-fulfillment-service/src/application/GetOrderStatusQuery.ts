import { OrderStatusViewRepositoryPort } from "./ports";

export type GetOrderStatusQueryRequest = Readonly<{ orderId: string }>;

export class GetOrderStatusQuery {
  constructor(private readonly orderStatusViewRepo: OrderStatusViewRepositoryPort) {}

  async execute(params: GetOrderStatusQueryRequest) {
    return await this.orderStatusViewRepo.getById(params.orderId);
  }
}

