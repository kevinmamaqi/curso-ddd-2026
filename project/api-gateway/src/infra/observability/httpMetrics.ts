import type { FastifyInstance } from "fastify";
import { metrics } from "@opentelemetry/api";

const kStartNs = Symbol("http_metrics_start_ns");

export function registerHttpMetrics(app: FastifyInstance, params: { serviceName: string }) {
  const meter = metrics.getMeter("http-server");

  const requestsTotal = meter.createCounter("http_server_requests_total", {
    description: "Count of inbound HTTP requests",
    unit: "1"
  });

  const requestDurationMs = meter.createHistogram("http_server_request_duration_ms", {
    description: "Inbound HTTP request duration",
    unit: "ms"
  });

  app.addHook("onRequest", async (request) => {
    (request as any)[kStartNs] = process.hrtime.bigint();
  });

  app.addHook("onResponse", async (request, reply) => {
    const endNs = process.hrtime.bigint();
    const startNs = (request as any)[kStartNs] as bigint | undefined;
    const durationMs = startNs ? Number(endNs - startNs) / 1e6 : undefined;

    const route =
      (request as any)?.routeOptions?.url ??
      (request as any)?.routerPath ??
      request.url ??
      "__unknown__";

    const attributes = {
      service: params.serviceName,
      method: request.method,
      route,
      status_code: String(reply.statusCode)
    };

    requestsTotal.add(1, attributes);
    if (durationMs !== undefined) requestDurationMs.record(durationMs, attributes);
  });
}

