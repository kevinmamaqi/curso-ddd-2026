import { OrderId } from "../domain/value-objects";
import { OrderStatusProjector } from "./OrderStatusProjector";
import { FulfillmentOrderRepositoryPort, UnitOfWorkPort } from "./ports";

export type ConfirmReadyToShipCommand = Readonly<{
  orderId: string;
}>;

export class ConfirmReadyToShipUseCase {
  constructor(
    private readonly repo: FulfillmentOrderRepositoryPort,
    private readonly orderStatusProjector: OrderStatusProjector,
    private readonly uow: UnitOfWorkPort
  ) {}

  async execute(cmd: ConfirmReadyToShipCommand): Promise<void> {
    await this.uow.runInTransaction(async () => {
      const order = await this.repo.getById(OrderId.of(cmd.orderId));
      if (!order) throw new Error("Order not found");

      order.markReadyToShip();
      await this.repo.save(order);
      await this.orderStatusProjector.project(order);
    });
  }
}

