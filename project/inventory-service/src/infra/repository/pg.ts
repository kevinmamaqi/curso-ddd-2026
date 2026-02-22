import { Client } from "pg";
import { DatabaseConfig } from "../../config/config";

export class DBClient {
    private client: Client;

    constructor(config: DatabaseConfig) {
        this.client = new Client({
            host: config.dbHost,
            port: config.dbPort,
            user: config.dbUser,
            password: config.dbPassword,
            database: config.dbName,
        });
    }

    async connect() {
        await this.client.connect();
    }

    async disconnect() {
        await this.client.end();
    }

    async query(query: string, params: any[]) {
        return await this.client.query(query, params);
    }

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
        await this.query("BEGIN", [])
        try {
            const result = await fn()
            await this.query("COMMIT", [])
            return result
        } catch (err) {
            await this.query("ROLLBACK", [])
            throw err
        }
    }
}
