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
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: Number(env.PORT) || 3002,
    host: env.HOST || "0.0.0.0",
    logLevel: (env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
    inventoryBaseUrl: env.INVENTORY_BASE_URL || "http://localhost:3000"
  };
}

