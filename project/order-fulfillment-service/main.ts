import Fastify from "fastify";
import { asClass, asValue, createContainer, InjectionMode } from "awilix";
import { AppConfig, loadConfig } from "./src/config/config";
import { PlaceOrderUseCase } from "./src/application/place-order-use-case";
import { GetOrderStatusQuery } from "./src/application/GetOrderStatusQuery";
import { HandleInventoryIntegrationEventUseCase } from "./src/application/HandleInventoryIntegrationEventUseCase";
import { OrderStatusProjector } from "./src/application/OrderStatusProjector";
import { healthRoutes } from "./src/infra/http/healthRoutes";
import { orderRouter } from "./src/infra/http/orderRouter";
import { integrationRouter } from "./src/infra/http/integrationRouter";
import { OutboxIntegrationEventPublisher } from "./src/infra/events/OutboxIntegrationEventPublisher";
import { OutboxHttpPublisher } from "./src/infra/events/OutboxHttpPublisher";
import { DBClient } from "./src/infra/repository/pg";
import { OutboxRepositoryPostgres } from "./src/infra/repository/OutboxRepositoryPostgres";
import { InboxRepositoryPostgres } from "./src/infra/repository/InboxRepositoryPostgres";
import { FulfillmentOrderRepositoryPostgres } from "./src/infra/repository/FulfillmentOrderRepositoryPostgres";
import { ReservationRoutingRepositoryPostgres } from "./src/infra/repository/ReservationRoutingRepositoryPostgres";
import { OrderStatusViewRepositoryPostgres } from "./src/infra/repository/OrderStatusViewRepositoryPostgres";
import { UnitOfWorkPostgres } from "./src/infra/repository/UnitOfWorkPostgres";

async function start() {
  const container = createContainer({ injectionMode: InjectionMode.CLASSIC });
  const config = loadConfig();
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
    getOrderStatusQuery: asClass(GetOrderStatusQuery).singleton(),
    handleInventoryIntegrationEventUseCase: asClass(HandleInventoryIntegrationEventUseCase).singleton(),
    outboxPublisher: asClass(OutboxHttpPublisher).singleton()
  });

  await container.resolve<OutboxRepositoryPostgres>("outboxRepo").initSchema();
  await container.resolve<InboxRepositoryPostgres>("inboxRepo").initSchema();
  await container.resolve<FulfillmentOrderRepositoryPostgres>("repo").initSchema();
  await container.resolve<ReservationRoutingRepositoryPostgres>("routingRepo").initSchema();
  await container.resolve<OrderStatusViewRepositoryPostgres>("orderStatusViewRepo").initSchema();

  const app = Fastify({ logger: true });

  app.register(healthRoutes);
  app.register(orderRouter, {
    deps: {
      placeOrderUseCase: container.resolve("placeOrderUseCase"),
      repo: container.resolve("repo"),
      getOrderStatusQuery: container.resolve("getOrderStatusQuery")
    }
  });
  app.register(integrationRouter, {
    deps: {
      handleInventoryIntegrationEventUseCase: container.resolve("handleInventoryIntegrationEventUseCase")
    }
  });

  const publisher = container.resolve<OutboxHttpPublisher>("outboxPublisher");
  publisher.start({ intervalMs: 500 });

  app.addHook("onClose", async () => {
    publisher.stop();
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
