import { DBClient } from "./pg";

export type OutboxMessage = Readonly<{
  id: string;
  destination: string;
  body: unknown;
  createdAt: Date;
}>;

export class OutboxRepositoryPostgres {
  constructor(private readonly dbClient: DBClient) {}

  async initSchema(): Promise<void> {
    await this.dbClient.query(
      `
      CREATE TABLE IF NOT EXISTS inventory_outbox_messages (
        id TEXT PRIMARY KEY,
        destination TEXT NOT NULL,
        body JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        sent_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS inventory_outbox_messages_unsent_idx ON inventory_outbox_messages (created_at)
      WHERE sent_at IS NULL;
      `,
      []
    );
  }

  async enqueue(params: { id: string; destination: string; body: unknown }): Promise<boolean> {
    const result = await this.dbClient.query(
      `
      INSERT INTO inventory_outbox_messages (id, destination, body)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (id) DO NOTHING
      `,
      [params.id, params.destination, JSON.stringify(params.body)]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getUnsent(limit = 50): Promise<OutboxMessage[]> {
    const result = await this.dbClient.query(
      `
      SELECT id, destination, body, created_at
      FROM inventory_outbox_messages
      WHERE sent_at IS NULL
      ORDER BY created_at ASC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows.map((r: any) => ({
      id: String(r.id),
      destination: String(r.destination),
      body: r.body,
      createdAt: new Date(r.created_at)
    }));
  }

  async markSent(id: string): Promise<void> {
    await this.dbClient.query(
      `UPDATE inventory_outbox_messages SET sent_at = now() WHERE id = $1`,
      [id]
    );
  }
}
