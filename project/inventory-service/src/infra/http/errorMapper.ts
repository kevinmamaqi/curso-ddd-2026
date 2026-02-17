import { FastifyInstance, FastifyReply } from "fastify";
import { DomainError } from "../../domain/errors";

export function mapErrorToHttpStatus(app: FastifyInstance, err: unknown, reply: FastifyReply) {
    if (err instanceof DomainError) {
        return reply.status(400).send({
            code: "DOMAIN_VALIDATION",
            message: err.message,
        });
    }
    app.log.error({ err }, "Unhandled error")
    return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Unexpected error",
    });
}
