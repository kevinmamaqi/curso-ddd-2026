import { FastifyInstance, FastifyReply } from "fastify";

export function mapErrorToHttpStatus(
  app: FastifyInstance,
  err: unknown,
  reply: FastifyReply
) {
  if (err instanceof Error) {
    return reply.status(400).send({
      code: "BAD_REQUEST",
      message: err.message
    });
  }

  app.log.error({ err }, "Unhandled error");
  return reply.status(500).send({
    code: "INTERNAL_ERROR",
    message: "Unexpected error"
  });
}

