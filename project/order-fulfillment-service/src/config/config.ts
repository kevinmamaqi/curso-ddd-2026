export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error"
}

export type AppConfig = {
  port: number;
  host: string;
  grpcPort: number;
  logLevel: LogLevel;
  logFile?: string;
  inventoryBaseUrl: string;
  rabbitmqUrl: string;
  rabbitmqExchange: string;
  rabbitmqDlx: string;
  rabbitmqMaxRetries: number;
  metricsPort: number;
  otelExporterOtlpEndpoint: string;
  otelServiceName: string;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;
};

export type DatabaseConfig = Pick<
  AppConfig,
  "dbHost" | "dbPort" | "dbUser" | "dbPassword" | "dbName"
>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: Number(env.PORT) || 3002,
    host: env.HOST || "0.0.0.0",
    grpcPort: Number(env.GRPC_PORT) || 50052,
    logLevel: (env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
    logFile: env.LOG_FILE || undefined,
    inventoryBaseUrl: env.INVENTORY_BASE_URL || "http://localhost:3000",
    rabbitmqUrl: env.RABBITMQ_URL || "amqp://localhost:5672",
    rabbitmqExchange: env.RABBITMQ_EXCHANGE || "course.events.v1",
    rabbitmqDlx: env.RABBITMQ_DLX || "course.dlx.v1",
    rabbitmqMaxRetries: Number(env.RABBITMQ_MAX_RETRIES) || 3,
    metricsPort: Number(env.METRICS_PORT) || 9465,
    otelExporterOtlpEndpoint:
      env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318",
    otelServiceName: env.OTEL_SERVICE_NAME || "order-fulfillment-service",
    dbHost: env.DATABASE_HOST || "localhost",
    dbPort: Number(env.DATABASE_PORT) || 5432,
    dbUser: env.DATABASE_USER || "postgres",
    dbPassword: env.DATABASE_PASSWORD || "postgres",
    dbName: env.DATABASE_NAME || "fulfillment"
  };
}
