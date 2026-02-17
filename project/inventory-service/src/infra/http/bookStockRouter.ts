import { FastifyPluginAsync } from "fastify";
import { ReserveBookCommand, ReserveBookUseCase } from "../../application/ReserveBookUseCase";
import { GetInventoryBySkuQuery } from "../../application/GetInventoryBySkuQuery";
import { mapErrorToHttpStatus } from "./errorMapper";

export type BookStockRouterDeps = {
    reserveBookUseCase: ReserveBookUseCase;
    getInventoryBySkuQuery: GetInventoryBySkuQuery;
}

export const bookStockRouter: FastifyPluginAsync<{deps: BookStockRouterDeps}> = async (app, options) => {
    const reserveHandler = async (bookId: string, request: any, reply: any) => {
        try{
            const body = (request.body ?? {}) as Partial<ReserveBookCommand>
            const cmd: ReserveBookCommand = {
                bookId,
                quantity: Number(body.quantity),
                reservationId: String(body.reservationId),
            }
            await options.deps.reserveBookUseCase.execute(cmd);
            return reply.status(204).send()
        } catch (err) {
            return mapErrorToHttpStatus(app, err, reply);
        }
    }

    app.post("/inventory/:sku/reserve", async (request, reply) => {
        const { sku } = request.params as { sku: string }
        return reserveHandler(sku, request, reply)
    })

    app.post("/book-stock/:bookId/reserve", async (request, reply) => {
        const { bookId } = request.params as { bookId: string }
        return reserveHandler(bookId, request, reply)
    })

    app.get("/inventory/:sku", async (request, reply) => {
        try {
            const { sku } = request.params as { sku: string }
            const result = await options.deps.getInventoryBySkuQuery.execute({ sku })
            if (!result) {
                return reply.status(404).send({ code: "NOT_FOUND", message: "Inventory view not found" })
            }
            return reply.send(result)
        } catch (err) {
            return mapErrorToHttpStatus(app, err, reply);
        }
    })

    app.post("/book-stock/:bookId/replenish", () => {})
    app.post("/book-stock/:bookId/release", () => {})
    app.get("/book-stock/:bookId", () => {})
    app.get("/book-stock", () => {})
}
