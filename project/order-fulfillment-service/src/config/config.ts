export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error"
}

export type AppConfig = {
  port: number;
  host: string;
  logLevel: LogLevel;
  inventoryBaseUrl: string;
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
    logLevel: (env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
    inventoryBaseUrl: env.INVENTORY_BASE_URL || "http://localhost:3000",
    dbHost: env.DATABASE_HOST || "localhost",
    dbPort: Number(env.DATABASE_PORT) || 5432,
    dbUser: env.DATABASE_USER || "postgres",
    dbPassword: env.DATABASE_PASSWORD || "postgres",
    dbName: env.DATABASE_NAME || "postgres"
  };
}
