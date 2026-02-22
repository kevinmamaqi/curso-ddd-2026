import { FastifyPluginAsync } from "fastify";
import { PlaceOrderCommand, PlaceOrderUseCase } from "../../application/place-order-use-case";
import { FulfillmentOrderRepositoryPort } from "../../application/ports";
import { OrderId } from "../../domain/value-objects";
import { mapErrorToHttpStatus } from "./errorMapper";
import { GetOrderStatusQuery } from "../../application/GetOrderStatusQuery";
import { CancelOrderUseCase } from "../../application/CancelOrderUseCase";
import { ConfirmReadyToShipUseCase } from "../../application/ConfirmReadyToShipUseCase";
import { GetPickListQuery } from "../../application/GetPickListQuery";
import { ListOrdersByStatusQuery } from "../../application/ListOrdersByStatusQuery";

export type OrderRouterDeps = {
  placeOrderUseCase: PlaceOrderUseCase;
  repo: FulfillmentOrderRepositoryPort;
  getOrderStatusQuery: GetOrderStatusQuery;
  cancelOrderUseCase: CancelOrderUseCase;
  confirmReadyToShipUseCase: ConfirmReadyToShipUseCase;
  getPickListQuery: GetPickListQuery;
  listOrdersByStatusQuery: ListOrdersByStatusQuery;
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

  app.post("/orders/:orderId/cancel", async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      await options.deps.cancelOrderUseCase.execute({ orderId });
      return reply.status(202).send();
    } catch (err) {
      if (err instanceof Error && err.message === "Order not found") {
        return reply.status(404).send({ code: "NOT_FOUND", message: "Order not found" });
      }
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.post("/orders/:orderId/ready-to-ship", async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      await options.deps.confirmReadyToShipUseCase.execute({ orderId });
      return reply.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message === "Order not found") {
        return reply.status(404).send({ code: "NOT_FOUND", message: "Order not found" });
      }
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.get("/orders/:orderId/pick-list", async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const out = await options.deps.getPickListQuery.execute({ orderId });
      if (!out) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "Order not found" });
      }
      return reply.send(out);
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.get("/orders", async (request, reply) => {
    try {
      const query = (request.query ?? {}) as Record<string, any>;
      const status = query.status ? String(query.status) : undefined;
      const out = await options.deps.listOrdersByStatusQuery.execute({ status });
      return reply.send(out);
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });
};
