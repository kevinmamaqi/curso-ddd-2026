import { FastifyPluginAsync } from "fastify";
import { ReserveBookUseCase } from "../../application/ReserveBookUseCase";

export type BookStockRouterDeps = {
    reserveBookUseCase: ReserveBookUseCase;
}

export const bookStockRouter: FastifyPluginAsync<{deps: BookStockRouterDeps}> = async (app, options) => {
    app.post("book-stock/:bookId/reserve", () => {})
    app.post("book-stock/:bookId/replenish", () => {})
    app.post("book-stock/:bookId/release", () => {})
    app.get("book-stock/:bookId", () => {})
    app.get("book-stock", () => {})
}