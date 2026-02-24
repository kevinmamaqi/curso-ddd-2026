import { FastifyInstance, FastifyReply } from "fastify";
import { isDownstreamHttpError } from "../adapters/http/httpClient";

export function mapErrorToHttpStatus(app: FastifyInstance, err: unknown, reply: FastifyReply) {
  if (isDownstreamHttpError(err)) {
    const body = err.body;
    const payload =
      body && typeof body === "object"
        ? body
        : { code: "DOWNSTREAM_HTTP_ERROR", message: err.message, status: err.status };
    return reply.status(err.status).send(payload);
  }

  if (err instanceof Error) {
    return reply.status(400).send({ code: "BAD_REQUEST", message: err.message });
  }

  app.log.error({ err }, "Unhandled error");
  return reply.status(500).send({ code: "INTERNAL_ERROR", message: "Unexpected error" });
}
