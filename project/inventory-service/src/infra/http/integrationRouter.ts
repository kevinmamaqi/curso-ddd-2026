import { FastifyPluginAsync } from "fastify";
import { mapErrorToHttpStatus } from "./errorMapper";
import { HandleReserveStockRequestedUseCase } from "../../application/HandleReserveStockRequestedUseCase";
import { IntegrationMessage, ReserveStockRequestedEvent } from "../integration/contracts";

export type IntegrationRouterDeps = {
  handleReserveStockRequestedUseCase: HandleReserveStockRequestedUseCase;
};

export const integrationRouter: FastifyPluginAsync<{ deps: IntegrationRouterDeps }> = async (
  app,
  options
) => {
  app.post("/integration/reserve-stock-requested", async (request, reply) => {
    try {
      const msg = request.body as IntegrationMessage<ReserveStockRequestedEvent>;
      await options.deps.handleReserveStockRequestedUseCase.execute(msg);
      return reply.status(202).send();
    } catch (err) {
      return mapErrorToHttpStatus(app, err, reply);
    }
  });
};

