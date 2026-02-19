export enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
}

export type AppConfig = {
    port: number;
    host: string;
    logLevel: LogLevel;
    orderServiceBaseUrl: string;
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
        logLevel: env.LOG_LEVEL as LogLevel || LogLevel.INFO,
        orderServiceBaseUrl: env.ORDER_SERVICE_BASE_URL || "http://localhost:3002",
        dbHost: env.DATABASE_HOST || "localhost",
        dbPort: Number(env.DATABASE_PORT) || 5432,
        dbUser: env.DATABASE_USER || "postgres",
        dbPassword: env.DATABASE_PASSWORD || "postgres",
        dbName: env.DATABASE_NAME || "postgres",
    }
}
