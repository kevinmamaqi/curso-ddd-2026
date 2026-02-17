import Fastify from "fastify";
import { asClass, asValue, createContainer, InjectionMode } from "awilix";
import { loadConfig } from "./src/config/config";
import { PlaceOrderUseCase } from "./src/application/place-order-use-case";
import { healthRoutes } from "./src/infra/http/healthRoutes";
import { orderRouter } from "./src/infra/http/orderRouter";
import { ConsoleIntegrationEventPublisher } from "./src/infra/events/ConsoleIntegrationEventPublisher";
import { InventoryReservationsHttpAdapter } from "./src/infra/integration/InventoryReservationsHttpAdapter";
import { FulfillmentOrderRepositoryInMemory } from "./src/infra/repository/FulfillmentOrderRepositoryInMemory";

function buildContainer() {
  const container = createContainer({ injectionMode: InjectionMode.CLASSIC });
  const config = loadConfig();

  container.register({
    config: asValue(config),
    repo: asClass(FulfillmentOrderRepositoryInMemory).singleton(),
    inventory: asClass(InventoryReservationsHttpAdapter).singleton(),
    events: asClass(ConsoleIntegrationEventPublisher).singleton(),
    placeOrderUseCase: asClass(PlaceOrderUseCase).singleton()
  });

  return container;
}

const container = buildContainer();
const app = Fastify({ logger: true });

app.register(healthRoutes);
app.register(orderRouter, {
  deps: {
    placeOrderUseCase: container.resolve("placeOrderUseCase"),
    repo: container.resolve("repo")
  }
});

const config = container.resolve("config") as ReturnType<typeof loadConfig>;
app.listen({ port: config.port, host: config.host }, (err, address) => {
  if (err) throw err;
  app.log.info(`Server is running on ${address}`);
});

