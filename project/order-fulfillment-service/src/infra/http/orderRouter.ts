import { FastifyPluginAsync } from "fastify";
import { PlaceOrderCommand, PlaceOrderUseCase } from "../../application/place-order-use-case";
import { FulfillmentOrderRepositoryPort } from "../../application/ports";
import { OrderId } from "../../domain/value-objects";
import { mapErrorToHttpStatus } from "./errorMapper";
import { GetOrderStatusQuery } from "../../application/GetOrderStatusQuery";

export type OrderRouterDeps = {
  placeOrderUseCase: PlaceOrderUseCase;
  repo: FulfillmentOrderRepositoryPort;
  getOrderStatusQuery: GetOrderStatusQuery;
};

export const orderRouter: FastifyPluginAsync<{ deps: OrderRouterDeps }> = async (
  app,
  options
) => {
  app.post("/orders", async (request, reply) => {
    try {
      await options.deps.placeOrderUseCase.execute(request.body as PlaceOrderCommand);
      return reply.status(202).send();
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.get("/orders/:orderId", async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const order = await options.deps.repo.getById(OrderId.of(orderId));
      if (!order) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "Order not found" });
      }

      return reply.send({
        orderId: order.id.toString(),
        status: order.getStatus(),
        reservationId: order.getReservationId()
      });
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.get("/orders/:orderId/status", async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const status = await options.deps.getOrderStatusQuery.execute({ orderId });
      if (!status) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "Order status not found" });
      }
      return reply.send(status);
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });
};
