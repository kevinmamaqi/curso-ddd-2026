import { OutboxRepositoryPostgres } from "../repository/OutboxRepositoryPostgres";

async function readResponseBody(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export class OutboxHttpPublisher {
  private timer?: NodeJS.Timeout;

  constructor(private readonly outboxRepo: OutboxRepositoryPostgres) {}

  start(params: { intervalMs: number }): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, params.intervalMs);
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }

  private async tick(): Promise<void> {
    const batch = await this.outboxRepo.getUnsent(50);
    for (const msg of batch) {
      try {
        const res = await fetch(msg.destination, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(msg.body)
        });

        if (!res.ok) {
          const body = await readResponseBody(res);
          throw new Error(
            `Outbox publish failed: ${res.status} ${res.statusText}${body ? ` - ${body}` : ""}`
          );
        }

        await this.outboxRepo.markSent(msg.id);
      } catch {
        // retry later
      }
    }
  }
}

