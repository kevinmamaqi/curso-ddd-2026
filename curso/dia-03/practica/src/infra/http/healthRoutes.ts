import { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get("/health", async () => ({ ok: true }))
    fastify.get("/ready", async () => ({ ok: true }))
}