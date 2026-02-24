import { Client } from "pg";
import { DatabaseConfig } from "../../config/config";

export class DBClient {
  private client: Client | null = null;
  private connectPromise: Promise<void> | null = null;
  private reconnectPromise: Promise<void> | null = null;
  private transactionDepth = 0;
  private readonly config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect() {
    await this.ensureConnected();
  }

  async disconnect() {
    this.connectPromise = null;
    this.reconnectPromise = null;
    this.transactionDepth = 0;
    if (!this.client) return;
    const current = this.client;
    this.client = null;
    await current.end();
  }

  async query(query: string, params: any[]) {
    await this.ensureConnected();
    const client = this.client;
    if (!client) throw new Error("DB client not connected");

    try {
      return await client.query(query, params);
    } catch (err) {
      if (this.isConnectionError(err)) {
        this.markDisconnected();
        if (this.transactionDepth > 0) {
          throw err;
        }
        await this.reconnect();
        const after = this.client;
        if (!after) throw err;
        return await after.query(query, params);
      }
      throw err;
    }
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    await this.ensureConnected();
    const client = this.client;
    if (!client) throw new Error("DB client not connected");

    this.transactionDepth += 1;
    try {
      try {
        await client.query("BEGIN");
      } catch (err) {
        if (!this.isConnectionError(err)) throw err;
        this.markDisconnected();
        await this.reconnect();
        const after = this.client;
        if (!after) throw err;
        await after.query("BEGIN");
      }

      const result = await fn();

      const commitClient = this.client;
      if (!commitClient) throw new Error("DB client not connected");
      await commitClient.query("COMMIT");
      return result;
    } catch (err) {
      try {
        const rollbackClient = this.client;
        if (rollbackClient) await rollbackClient.query("ROLLBACK");
      } catch {
        // ignore
      }
      if (this.isConnectionError(err)) {
        this.markDisconnected();
      }
      throw err;
    } finally {
      this.transactionDepth -= 1;
    }
  }

  private createClient(): Client {
    return new Client({
      host: this.config.dbHost,
      port: this.config.dbPort,
      user: this.config.dbUser,
      password: this.config.dbPassword,
      database: this.config.dbName
    });
  }

  private async ensureConnected(): Promise<void> {
    if (this.client) return;
    if (this.connectPromise) return await this.connectPromise;

    this.connectPromise = (async () => {
      const next = this.createClient();
      try {
        await next.connect();
        this.client = next;
      } catch (err) {
        try {
          await next.end();
        } catch {
          // ignore
        }
        throw err;
      } finally {
        this.connectPromise = null;
      }
    })();

    return await this.connectPromise;
  }

  private markDisconnected(): void {
    if (!this.client) return;
    const current = this.client;
    this.client = null;
    void current.end().catch(() => undefined);
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectPromise) return await this.reconnectPromise;
    this.reconnectPromise = (async () => {
      this.markDisconnected();
      await this.ensureConnected();
    })().finally(() => {
      this.reconnectPromise = null;
    });
    return await this.reconnectPromise;
  }

  private isConnectionError(err: unknown): boolean {
    const anyErr = err as any;
    const code = anyErr?.code as string | undefined;
    const message = String(anyErr?.message ?? "");

    const codes = new Set([
      "ECONNRESET",
      "ECONNREFUSED",
      "EPIPE",
      "ETIMEDOUT",
      "57P01",
      "57P02",
      "57P03"
    ]);
    if (code && codes.has(code)) return true;

    return (
      message.includes("Connection terminated") ||
      message.includes("terminating connection") ||
      message.includes("the database system is starting up") ||
      message.includes("Client has encountered a connection error")
    );
  }
}
