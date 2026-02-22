import { OutboxRepositoryPostgres } from "../repository/OutboxRepositoryPostgres";
import { AppConfig } from "../../config/config";
import { connectRabbit, createConfirmChannel, assertTopology } from "../messaging/rabbitmq";
import * as amqplib from "amqplib";

type PublishOptions = Readonly<{
  intervalMs: number;
  batchSize?: number;
}>;

export class OutboxRabbitPublisher {
  private timer?: NodeJS.Timeout;
  private conn?: amqplib.ChannelModel;
  private channel?: amqplib.ConfirmChannel;

  constructor(
    private readonly config: AppConfig,
    private readonly outboxRepo: OutboxRepositoryPostgres
  ) {}

  async start(options: PublishOptions): Promise<void> {
    if (this.timer) return;
    const url = this.config.rabbitmqUrl;
    const exchange = this.config.rabbitmqExchange;
    const dlx = this.config.rabbitmqDlx;

    this.conn = await connectRabbit({ url, exchange, dlx });
    this.channel = await createConfirmChannel(this.conn);
    await assertTopology({ channel: this.channel, exchange, dlx });

    const batchSize = options.batchSize ?? 50;
    this.timer = setInterval(() => {
      void this.tick(batchSize);
    }, options.intervalMs);
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    try {
      await this.channel?.close();
    } catch {
      // ignore
    }
    try {
      await this.conn?.close();
    } catch {
      // ignore
    }
    this.channel = undefined;
    this.conn = undefined;
  }

  private async tick(batchSize: number): Promise<void> {
    if (!this.channel) return;
    const exchange = this.config.rabbitmqExchange;
    const batch = await this.outboxRepo.getUnsent(batchSize);

    for (const msg of batch) {
      try {
        const body = Buffer.from(JSON.stringify(msg.body));
        const routingKey = msg.destination;

        this.channel.publish(exchange, routingKey, body, {
          persistent: true,
          contentType: "application/json",
          messageId: msg.id,
          correlationId: (msg.body as any)?.correlationId ?? msg.id
        });

        await this.channel.waitForConfirms();
        await this.outboxRepo.markSent(msg.id);
      } catch {
        // retry later
      }
    }
  }
}
