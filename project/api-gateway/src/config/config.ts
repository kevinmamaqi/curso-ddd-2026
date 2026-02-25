export type DownstreamTransport = "http" | "grpc";

export type GatewayConfig = Readonly<{
  port: number;
  host: string;
  downstreamTransport: DownstreamTransport;

  inventoryBaseUrl: string;
  fulfillmentBaseUrl: string;

  inventoryGrpcAddress: string;
  fulfillmentGrpcAddress: string;

  requestTimeoutMs: number;

  logFile?: string;

  metricsPort: number;
  otelExporterOtlpEndpoint: string;
  otelServiceName: string;
}>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const downstreamTransport = (env.DOWNSTREAM_TRANSPORT as DownstreamTransport) || "grpc";

  return {
    port: Number(env.PORT) || 8080,
    host: env.HOST || "0.0.0.0",
    downstreamTransport,
    inventoryBaseUrl: env.INVENTORY_BASE_URL || "http://localhost:3000",
    fulfillmentBaseUrl: env.FULFILLMENT_BASE_URL || "http://localhost:3002",
    inventoryGrpcAddress: env.INVENTORY_GRPC_ADDRESS || "localhost:50051",
    fulfillmentGrpcAddress: env.FULFILLMENT_GRPC_ADDRESS || "localhost:50052",
    requestTimeoutMs: Number(env.REQUEST_TIMEOUT_MS) || 2_000,
    logFile: env.LOG_FILE || undefined,
    metricsPort: Number(env.METRICS_PORT) || 9466,
    otelExporterOtlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318",
    otelServiceName: env.OTEL_SERVICE_NAME || "api-gateway"
  };
}
