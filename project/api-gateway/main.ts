import Fastify from "fastify";
import { loadConfig } from "./src/config/config";
import { startOtel } from "./src/infra/observability/otel";
import { registerHttpMetrics } from "./src/infra/observability/httpMetrics";
import { InventoryHttpAdapter } from "./src/infra/adapters/InventoryHttpAdapter";
import { FulfillmentHttpAdapter } from "./src/infra/adapters/FulfillmentHttpAdapter";
import { InventoryGrpcAdapter } from "./src/infra/adapters/InventoryGrpcAdapter";
import { FulfillmentGrpcAdapter } from "./src/infra/adapters/FulfillmentGrpcAdapter";
import { PlaceOrderViaGatewayUseCase } from "./src/application/use-cases/PlaceOrderViaGatewayUseCase";
import { GetOrderWithDetailsUseCase } from "./src/application/use-cases/GetOrderWithDetailsUseCase";
import { HealthCheckUseCase } from "./src/application/use-cases/HealthCheckUseCase";
import { GetInventoryStockUseCase } from "./src/application/use-cases/GetInventoryStockUseCase";
import { ReserveStockViaGatewayUseCase } from "./src/application/use-cases/ReserveStockViaGatewayUseCase";
import { ReplenishStockViaGatewayUseCase } from "./src/application/use-cases/ReplenishStockViaGatewayUseCase";
import { ReleaseReservationViaGatewayUseCase } from "./src/application/use-cases/ReleaseReservationViaGatewayUseCase";
import { gatewayRoutes } from "./src/infra/http/routes";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

async function start() {
  const config = loadConfig();
  const otelSdk = await startOtel({
    serviceName: config.otelServiceName,
    otlpEndpoint: config.otelExporterOtlpEndpoint,
    metricsPort: config.metricsPort
  });
  const loggerConfig = config.logFile
    ? (() => {
        fs.mkdirSync(path.dirname(config.logFile as string), { recursive: true });
        return { level: "info" as const, file: config.logFile };
      })()
    : { level: "info" as const };
  const app = Fastify({
    logger: loggerConfig,
    genReqId: (req) => {
      const raw = req.headers["x-correlation-id"];
      const correlationId = typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
      return correlationId ?? randomUUID();
    }
  });
  registerHttpMetrics(app, { serviceName: config.otelServiceName });

  const inventory =
    config.downstreamTransport === "grpc"
      ? new InventoryGrpcAdapter(config.inventoryGrpcAddress)
      : new InventoryHttpAdapter(config.inventoryBaseUrl, config.requestTimeoutMs);

  const fulfillment =
    config.downstreamTransport === "grpc"
      ? new FulfillmentGrpcAdapter(config.fulfillmentGrpcAddress)
      : new FulfillmentHttpAdapter(config.fulfillmentBaseUrl, config.requestTimeoutMs);

  const placeOrder = new PlaceOrderViaGatewayUseCase(fulfillment);
  const getOrderWithDetails = new GetOrderWithDetailsUseCase(fulfillment, inventory);
  const getInventoryStock = new GetInventoryStockUseCase(inventory);
  const reserveStock = new ReserveStockViaGatewayUseCase(inventory);
  const replenishStock = new ReplenishStockViaGatewayUseCase(inventory);
  const releaseReservation = new ReleaseReservationViaGatewayUseCase(inventory);

  const health =
    config.downstreamTransport === "grpc"
      ? new HealthCheckUseCase(
          async () => {
            try {
              await inventory.getStock("__health__");
              return true;
            } catch (err: unknown) {
              return (err as { code?: number })?.code === 5; // NOT_FOUND = service reachable
            }
          },
          async () => {
            try {
              await fulfillment.getOrder("__health__");
              return true;
            } catch (err: unknown) {
              return (err as { code?: number })?.code === 5; // NOT_FOUND = service reachable
            }
          }
        )
      : new HealthCheckUseCase(
          async () => {
            try {
              const res = await fetch(new URL("/health", config.inventoryBaseUrl));
              return res.ok;
            } catch {
              return false;
            }
          },
          async () => {
            try {
              const res = await fetch(new URL("/health", config.fulfillmentBaseUrl));
              return res.ok;
            } catch {
              return false;
            }
          }
        );

  app.register(gatewayRoutes, {
    deps: {
      placeOrder,
      getOrderWithDetails,
      health,
      getInventoryStock,
      reserveStock,
      replenishStock,
      releaseReservation,
      cancelOrder: (orderId: string, opts?: { correlationId?: string }) => fulfillment.cancelOrder(orderId, opts),
      getPickList: (orderId: string, opts?: { correlationId?: string }) => fulfillment.getPickList(orderId, opts)
    }
  });

  app.addHook("onClose", async () => {
    await otelSdk.shutdown();
  });

  await app.listen({ port: config.port, host: config.host });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
