import { FastifyPluginAsync } from "fastify";
import { PlaceOrderViaGatewayUseCase } from "../../application/use-cases/PlaceOrderViaGatewayUseCase";
import { GetOrderWithDetailsUseCase } from "../../application/use-cases/GetOrderWithDetailsUseCase";
import { HealthCheckUseCase } from "../../application/use-cases/HealthCheckUseCase";
import { GetInventoryStockUseCase } from "../../application/use-cases/GetInventoryStockUseCase";
import { ReserveStockViaGatewayUseCase } from "../../application/use-cases/ReserveStockViaGatewayUseCase";
import { ReplenishStockViaGatewayUseCase } from "../../application/use-cases/ReplenishStockViaGatewayUseCase";
import { ReleaseReservationViaGatewayUseCase } from "../../application/use-cases/ReleaseReservationViaGatewayUseCase";
import { mapErrorToHttpStatus } from "./errorMapper";

export type GatewayRoutesDeps = {
  placeOrder: PlaceOrderViaGatewayUseCase;
  getOrderWithDetails: GetOrderWithDetailsUseCase;
  health: HealthCheckUseCase;
  getInventoryStock: GetInventoryStockUseCase;
  reserveStock: ReserveStockViaGatewayUseCase;
  replenishStock: ReplenishStockViaGatewayUseCase;
  releaseReservation: ReleaseReservationViaGatewayUseCase;
  cancelOrder: (orderId: string, opts?: { correlationId?: string }) => Promise<void>;
  getPickList: (orderId: string, opts?: { correlationId?: string }) => Promise<any | null>;
};

export const gatewayRoutes: FastifyPluginAsync<{ deps: GatewayRoutesDeps }> = async (app, options) => {
  app.get("/health", async (_req, reply) => {
    const out = await options.deps.health.execute();
    return reply.status(out.ok ? 200 : 503).send(out);
  });

  app.post("/orders", async (request, reply) => {
    try {
      const correlationId = (request.headers["x-correlation-id"] as string | undefined) ?? undefined;
      await options.deps.placeOrder.execute(request.body as any, { correlationId });
      return reply.status(202).send();
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.get("/orders/:orderId", async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const correlationId = (request.headers["x-correlation-id"] as string | undefined) ?? undefined;
      const out = await options.deps.getOrderWithDetails.execute(orderId, { correlationId });
      if (!out) return reply.status(404).send({ code: "NOT_FOUND", message: "Order not found" });
      return reply.send(out);
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.get("/orders/:orderId/status", async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const correlationId = (request.headers["x-correlation-id"] as string | undefined) ?? undefined;
      const out = await options.deps.getOrderWithDetails.execute(orderId, { correlationId });
      if (!out) return reply.status(404).send({ code: "NOT_FOUND", message: "Order not found" });
      return reply.send(out.order);
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.post("/orders/:orderId/cancel", async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const correlationId = (request.headers["x-correlation-id"] as string | undefined) ?? undefined;
      await options.deps.cancelOrder(orderId, { correlationId });
      return reply.status(202).send();
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.get("/orders/:orderId/pick-list", async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const correlationId = (request.headers["x-correlation-id"] as string | undefined) ?? undefined;
      const out = await options.deps.getPickList(orderId, { correlationId });
      if (!out) return reply.status(404).send({ code: "NOT_FOUND", message: "Order not found" });
      return reply.send(out);
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.get("/inventory/:sku", async (request, reply) => {
    try {
      const { sku } = request.params as { sku: string };
      const correlationId = (request.headers["x-correlation-id"] as string | undefined) ?? undefined;
      const out = await options.deps.getInventoryStock.execute(sku, { correlationId });
      if (!out) return reply.status(404).send({ code: "NOT_FOUND", message: "Stock not found" });
      return reply.send(out);
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.post("/inventory/:sku/reserve", async (request, reply) => {
    try {
      const { sku } = request.params as { sku: string };
      const body = (request.body ?? {}) as any;
      const correlationId = (request.headers["x-correlation-id"] as string | undefined) ?? undefined;
      await options.deps.reserveStock.execute(
        { sku, reservationId: String(body.reservationId), quantity: Number(body.quantity) },
        { correlationId }
      );
      return reply.status(204).send();
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.post("/inventory/:sku/replenish", async (request, reply) => {
    try {
      const { sku } = request.params as { sku: string };
      const body = (request.body ?? {}) as any;
      const correlationId = (request.headers["x-correlation-id"] as string | undefined) ?? undefined;
      await options.deps.replenishStock.execute(
        { sku, quantity: Number(body.quantity) },
        { correlationId }
      );
      return reply.status(204).send();
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });

  app.post("/inventory/:sku/release", async (request, reply) => {
    try {
      const { sku } = request.params as { sku: string };
      const body = (request.body ?? {}) as any;
      const correlationId = (request.headers["x-correlation-id"] as string | undefined) ?? undefined;
      await options.deps.releaseReservation.execute(
        { sku, reservationId: String(body.reservationId) },
        { correlationId }
      );
      return reply.status(204).send();
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });
};
