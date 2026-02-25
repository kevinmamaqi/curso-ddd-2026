import type { FastifyBaseLogger } from "fastify";
import type { LoggerPort } from "../../application/ports/LoggerPort";

export class FastifyLoggerAdapter implements LoggerPort {
  constructor(private readonly pino: FastifyBaseLogger) {}

  debug(obj: unknown, msg?: string): void {
    this.pino.debug(obj as object, msg);
  }

  info(obj: unknown, msg?: string): void {
    this.pino.info(obj as object, msg);
  }

  warn(obj: unknown, msg?: string): void {
    this.pino.warn(obj as object, msg);
  }

  error(obj: unknown, msg?: string): void {
    this.pino.error(obj as object, msg);
  }
}
