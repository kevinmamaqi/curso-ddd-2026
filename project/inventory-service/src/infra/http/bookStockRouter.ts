import { FastifyPluginAsync } from "fastify";
import { ReserveBookCommand, ReserveBookUseCase } from "../../application/ReserveBookUseCase";
import { mapErrorToHttpStatus } from "./errorMapper";

export type BookStockRouterDeps = {
    reserveBookUseCase: ReserveBookUseCase;
}

export const bookStockRouter: FastifyPluginAsync<{deps: BookStockRouterDeps}> = async (app, options) => {
    app.post("book-stock/:bookId/reserve", async (request, reply) => {
        try{
            await options.deps.reserveBookUseCase.execute(request.body as ReserveBookCommand);
        } catch (err) {
            return mapErrorToHttpStatus(app, err, reply);
        }
    })
    app.post("book-stock/:bookId/replenish", () => {})
    app.post("book-stock/:bookId/release", () => {})
    app.get("book-stock/:bookId", () => {})
    app.get("book-stock", () => {})
}