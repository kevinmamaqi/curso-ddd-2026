import { FastifyPluginAsync } from "fastify";
import { mapErrorToHttpStatus } from "./errorMapper";
import { HandleInventoryIntegrationEventUseCase } from "../../application/HandleInventoryIntegrationEventUseCase";
import { InventoryIntegrationEvents, IntegrationMessage } from "../../domain/events";

export type IntegrationRouterDeps = {
  handleInventoryIntegrationEventUseCase: HandleInventoryIntegrationEventUseCase;
};

export const integrationRouter: FastifyPluginAsync<{ deps: IntegrationRouterDeps }> = async (
  app,
  options
) => {
  app.post("/integration/inventory-events", async (request, reply) => {
    try {
      const msg = request.body as IntegrationMessage<InventoryIntegrationEvents>;
      await options.deps.handleInventoryIntegrationEventUseCase.execute(msg);
      return reply.status(202).send();
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });
};

