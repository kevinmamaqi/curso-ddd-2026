import Fastify from "fastify";
import { asClass, asValue, createContainer, InjectionMode } from "awilix";
import { AppConfig, loadConfig } from "./src/config/config";
import { PlaceOrderUseCase } from "./src/application/place-order-use-case";
import { GetOrderStatusQuery } from "./src/application/GetOrderStatusQuery";
import { CancelOrderUseCase } from "./src/application/CancelOrderUseCase";
import { ConfirmReadyToShipUseCase } from "./src/application/ConfirmReadyToShipUseCase";
import { GetPickListQuery } from "./src/application/GetPickListQuery";
import { ListOrdersByStatusQuery } from "./src/application/ListOrdersByStatusQuery";
import { HandleInventoryIntegrationEventUseCase } from "./src/application/HandleInventoryIntegrationEventUseCase";
import { OrderStatusProjector } from "./src/application/OrderStatusProjector";
import { healthRoutes } from "./src/infra/http/healthRoutes";
import { orderRouter } from "./src/infra/http/orderRouter";
import { integrationRouter } from "./src/infra/http/integrationRouter";
import { OutboxIntegrationEventPublisher } from "./src/infra/events/OutboxIntegrationEventPublisher";
import { OutboxRabbitPublisher } from "./src/infra/events/OutboxRabbitPublisher";
import { DBClient } from "./src/infra/repository/pg";
import { OutboxRepositoryPostgres } from "./src/infra/repository/OutboxRepositoryPostgres";
import { InboxRepositoryPostgres } from "./src/infra/repository/InboxRepositoryPostgres";
import { FulfillmentOrderRepositoryPostgres } from "./src/infra/repository/FulfillmentOrderRepositoryPostgres";
import { ReservationRoutingRepositoryPostgres } from "./src/infra/repository/ReservationRoutingRepositoryPostgres";
import { OrderStatusViewRepositoryPostgres } from "./src/infra/repository/OrderStatusViewRepositoryPostgres";
import { UnitOfWorkPostgres } from "./src/infra/repository/UnitOfWorkPostgres";
import { InventoryResultsRabbitConsumer } from "./src/infra/messaging/InventoryResultsRabbitConsumer";
import { startOtel } from "./src/infra/observability/otel";
import { FulfillmentGrpcServer } from "./src/infra/grpc/FulfillmentGrpcServer";
import pino from "pino";
import fs from "node:fs";
import path from "node:path";

async function start() {
  const container = createContainer({ injectionMode: InjectionMode.CLASSIC });
  const config = loadConfig();

  const otelSdk = await startOtel({
    serviceName: config.otelServiceName,
    otlpEndpoint: config.otelExporterOtlpEndpoint,
    metricsPort: config.metricsPort
  });

  const dbClient = new DBClient(config);
  await dbClient.connect();

  container.register({
    config: asValue(config),
    dbClient: asValue(dbClient),
    uow: asClass(UnitOfWorkPostgres).singleton(),
    outboxRepo: asClass(OutboxRepositoryPostgres).singleton(),
    inboxRepo: asClass(InboxRepositoryPostgres).singleton(),
    repo: asClass(FulfillmentOrderRepositoryPostgres).singleton(),
    routingRepo: asClass(ReservationRoutingRepositoryPostgres).singleton(),
    orderStatusViewRepo: asClass(OrderStatusViewRepositoryPostgres).singleton(),
    orderStatusProjector: asClass(OrderStatusProjector).singleton(),
    events: asClass(OutboxIntegrationEventPublisher).singleton(),
    placeOrderUseCase: asClass(PlaceOrderUseCase).singleton(),
    cancelOrderUseCase: asClass(CancelOrderUseCase).singleton(),
    confirmReadyToShipUseCase: asClass(ConfirmReadyToShipUseCase).singleton(),
    getOrderStatusQuery: asClass(GetOrderStatusQuery).singleton(),
    getPickListQuery: asClass(GetPickListQuery).singleton(),
    listOrdersByStatusQuery: asClass(ListOrdersByStatusQuery).singleton(),
    handleInventoryIntegrationEventUseCase: asClass(HandleInventoryIntegrationEventUseCase).singleton(),
    outboxPublisher: asClass(OutboxRabbitPublisher).singleton(),
    inventoryResultsConsumer: asClass(InventoryResultsRabbitConsumer)
      .inject((cradle: any) => ({ useCase: cradle.handleInventoryIntegrationEventUseCase }))
      .singleton(),
    grpcServer: asClass(FulfillmentGrpcServer).singleton()
  });

  await container.resolve<OutboxRepositoryPostgres>("outboxRepo").initSchema();
  await container.resolve<InboxRepositoryPostgres>("inboxRepo").initSchema();
  await container.resolve<FulfillmentOrderRepositoryPostgres>("repo").initSchema();
  await container.resolve<ReservationRoutingRepositoryPostgres>("routingRepo").initSchema();
  await container.resolve<OrderStatusViewRepositoryPostgres>("orderStatusViewRepo").initSchema();

  const logger =
    config.logFile
      ? (() => {
          fs.mkdirSync(path.dirname(config.logFile as string), { recursive: true });
          return pino({}, pino.destination({ dest: config.logFile as string, sync: false }));
        })()
      : true;
  const app = Fastify({ logger });

  app.register(healthRoutes);
  app.register(orderRouter, {
    deps: {
      placeOrderUseCase: container.resolve("placeOrderUseCase"),
      repo: container.resolve("repo"),
      getOrderStatusQuery: container.resolve("getOrderStatusQuery"),
      cancelOrderUseCase: container.resolve("cancelOrderUseCase"),
      confirmReadyToShipUseCase: container.resolve("confirmReadyToShipUseCase"),
      getPickListQuery: container.resolve("getPickListQuery"),
      listOrdersByStatusQuery: container.resolve("listOrdersByStatusQuery")
    }
  });
  app.register(integrationRouter, {
    deps: {
      handleInventoryIntegrationEventUseCase: container.resolve("handleInventoryIntegrationEventUseCase")
    }
  });

  const publisher = container.resolve<OutboxRabbitPublisher>("outboxPublisher");
  await publisher.start({ intervalMs: 500 });

  const consumer = container.resolve<InventoryResultsRabbitConsumer>("inventoryResultsConsumer");
  await consumer.start();

  const grpcServer = container.resolve<FulfillmentGrpcServer>("grpcServer");
  await grpcServer.start();

  app.addHook("onClose", async () => {
    await consumer.stop();
    await publisher.stop();
    await grpcServer.stop();
    await otelSdk.shutdown();
    await dbClient.disconnect();
  });

  app.listen({ port: config.port, host: config.host }, (err, address) => {
    if (err) throw err;
    app.log.info(`Server is running on ${address}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
