import { DBClient } from "./pg";

export class InboxRepositoryPostgres {
  constructor(private readonly dbClient: DBClient) {}

  async initSchema(): Promise<void> {
    await this.dbClient.query(
      `
      CREATE TABLE IF NOT EXISTS order_inbox_messages (
        message_id TEXT PRIMARY KEY,
        processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      `,
      []
    );
  }

  async tryAccept(messageId: string): Promise<boolean> {
    const result = await this.dbClient.query(
      `
      INSERT INTO order_inbox_messages (message_id)
      VALUES ($1)
      ON CONFLICT (message_id) DO NOTHING
      `,
      [messageId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
