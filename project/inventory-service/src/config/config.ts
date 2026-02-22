export enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
}

export type AppConfig = {
    port: number;
    host: string;
    grpcPort: number;
    logLevel: LogLevel;
    logFile?: string;
    orderServiceBaseUrl: string;
    rabbitmqUrl: string;
    rabbitmqExchange: string;
    rabbitmqDlx: string;
    rabbitmqMaxRetries: number;
    metricsPort: number;
    otelExporterOtlpEndpoint: string;
    otelServiceName: string;
}

export type DatabaseConfig = {
    dbHost: string;
    dbPort: number;
    dbUser: string;
    dbPassword: string;
    dbName: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig & DatabaseConfig {
    return {
        port: Number(env.PORT) || 3000,
        host: env.HOST || "0.0.0.0",
        grpcPort: Number(env.GRPC_PORT) || 50051,
        logLevel: env.LOG_LEVEL as LogLevel || LogLevel.INFO,
        logFile: env.LOG_FILE || undefined,
        orderServiceBaseUrl: env.ORDER_SERVICE_BASE_URL || "http://localhost:3002",
        rabbitmqUrl: env.RABBITMQ_URL || "amqp://localhost:5672",
        rabbitmqExchange: env.RABBITMQ_EXCHANGE || "course.events.v1",
        rabbitmqDlx: env.RABBITMQ_DLX || "course.dlx.v1",
        rabbitmqMaxRetries: Number(env.RABBITMQ_MAX_RETRIES) || 3,
        metricsPort: Number(env.METRICS_PORT) || 9464,
        otelExporterOtlpEndpoint:
          env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318",
        otelServiceName: env.OTEL_SERVICE_NAME || "inventory-service",
        dbHost: env.DATABASE_HOST || "localhost",
        dbPort: Number(env.DATABASE_PORT) || 5432,
        dbUser: env.DATABASE_USER || "postgres",
        dbPassword: env.DATABASE_PASSWORD || "postgres",
        dbName: env.DATABASE_NAME || "inventory",
    }
}
