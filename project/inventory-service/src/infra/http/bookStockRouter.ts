import { FastifyPluginAsync } from "fastify";
import { ReserveBookCommand, ReserveBookUseCase } from "../../application/ReserveBookUseCase";
import { GetInventoryBySkuQuery } from "../../application/GetInventoryBySkuQuery";
import { ReplenishStockCommand, ReplenishStockUseCase } from "../../application/ReplenishStockUseCase";
import { ReleaseReservationCommand, ReleaseReservationUseCase } from "../../application/ReleaseReservationUseCase";
import { ListInventoryQuery } from "../../application/ListInventoryQuery";
import { GetReservationsByReservationIdQuery } from "../../application/GetReservationsByReservationIdQuery";
import { mapErrorToHttpStatus } from "./errorMapper";

export type BookStockRouterDeps = {
    reserveBookUseCase: ReserveBookUseCase;
    getInventoryBySkuQuery: GetInventoryBySkuQuery;
    replenishStockUseCase: ReplenishStockUseCase;
    releaseReservationUseCase: ReleaseReservationUseCase;
    listInventoryQuery: ListInventoryQuery;
    getReservationsByReservationIdQuery: GetReservationsByReservationIdQuery;
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

    const replenishHandler = async (sku: string, request: any, reply: any) => {
        try {
            const body = (request.body ?? {}) as Partial<ReplenishStockCommand>
            await options.deps.replenishStockUseCase.execute({
                sku,
                quantity: Number(body.quantity),
            })
            return reply.status(204).send()
        } catch (err) {
            return mapErrorToHttpStatus(app, err, reply);
        }
    }

    const releaseHandler = async (sku: string, request: any, reply: any) => {
        try {
            const body = (request.body ?? {}) as Partial<ReleaseReservationCommand>
            await options.deps.releaseReservationUseCase.execute({
                sku,
                reservationId: String(body.reservationId),
            })
            return reply.status(204).send()
        } catch (err) {
            return mapErrorToHttpStatus(app, err, reply);
        }
    }

    app.post("/inventory/:sku/replenish", async (request, reply) => {
        const { sku } = request.params as { sku: string }
        return replenishHandler(sku, request, reply)
    })
    app.post("/inventory/:sku/release", async (request, reply) => {
        const { sku } = request.params as { sku: string }
        return releaseHandler(sku, request, reply)
    })

    app.get("/inventory", async (request, reply) => {
        try {
            const query = (request.query ?? {}) as Record<string, any>
            const sku = query.sku ? String(query.sku) : undefined
            const onlyAvailable = query.onlyAvailable !== undefined
                ? String(query.onlyAvailable) === "true" || String(query.onlyAvailable) === "1"
                : undefined
            const result = await options.deps.listInventoryQuery.execute({ sku, onlyAvailable })
            return reply.send({ items: result })
        } catch (err) {
            return mapErrorToHttpStatus(app, err, reply);
        }
    })

    app.get("/inventory/reservations/:reservationId", async (request, reply) => {
        try {
            const { reservationId } = request.params as { reservationId: string }
            const result = await options.deps.getReservationsByReservationIdQuery.execute({ reservationId })
            return reply.send({ items: result })
        } catch (err) {
            return mapErrorToHttpStatus(app, err, reply);
        }
    })

    // Backwards-compatible aliases (dia-06/dia-07 naming)
    app.post("/book-stock/:bookId/replenish", async (request, reply) => {
        const { bookId } = request.params as { bookId: string }
        return replenishHandler(bookId, request, reply)
    })
    app.post("/book-stock/:bookId/release", async (request, reply) => {
        const { bookId } = request.params as { bookId: string }
        return releaseHandler(bookId, request, reply)
    })
    app.get("/book-stock/:bookId", async (request, reply) => {
        const { bookId } = request.params as { bookId: string }
        return app.inject({ method: "GET", url: `/inventory/${encodeURIComponent(bookId)}` }).then((r) =>
            reply.status(r.statusCode).send(r.json())
        )
    })
    app.get("/book-stock", async (request, reply) => {
        const out = await app.inject({ method: "GET", url: `/inventory` })
        return reply.status(out.statusCode).send(out.json())
    })
}
