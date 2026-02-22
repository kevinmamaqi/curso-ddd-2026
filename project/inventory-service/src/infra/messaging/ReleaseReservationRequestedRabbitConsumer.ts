import * as amqplib from "amqplib";
import { AppConfig } from "../../config/config";
import { assertTopology, connectRabbit, createChannel } from "./rabbitmq";
import { HandleReleaseReservationRequestedUseCase } from "../../application/HandleReleaseReservationRequestedUseCase";
import { IntegrationMessage, ReleaseReservationRequestedEvent } from "../integration/contracts";

const MAIN_QUEUE = "inventory.release_reservation_requested.v1";
const DLQ_QUEUE = "inventory.release_reservation_requested.dlq";
const RETRY_QUEUE_10S = "inventory.release_reservation_requested.retry.10s";

const RK_RELEASE_REQUESTED = "fulfillment.release-reservation-requested.v1";

export class ReleaseReservationRequestedRabbitConsumer {
  private conn?: amqplib.ChannelModel;
  private channel?: amqplib.Channel;
  private consumerTag?: string;

  constructor(
    private readonly config: AppConfig,
    private readonly useCase: HandleReleaseReservationRequestedUseCase
  ) {}

  async start(): Promise<void> {
    if (this.conn) return;
    this.conn = await connectRabbit({
      url: this.config.rabbitmqUrl,
      exchange: this.config.rabbitmqExchange,
      dlx: this.config.rabbitmqDlx
    });
    this.channel = await createChannel(this.conn);
    await assertTopology({
      channel: this.channel,
      exchange: this.config.rabbitmqExchange,
      dlx: this.config.rabbitmqDlx
    });

    await this.assertQueuesAndBindings();
    await this.channel.prefetch(10);

    const res = await this.channel.consume(
      MAIN_QUEUE,
      async (msg: amqplib.ConsumeMessage | null) => {
        if (!msg) return;
        await this.handleMessage(msg);
      },
      { noAck: false }
    );
    this.consumerTag = res.consumerTag;
  }

  async stop(): Promise<void> {
    try {
      if (this.channel && this.consumerTag) {
        await this.channel.cancel(this.consumerTag);
      }
    } catch {
      // ignore
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
    this.consumerTag = undefined;
    this.channel = undefined;
    this.conn = undefined;
  }

  private async assertQueuesAndBindings(): Promise<void> {
    if (!this.channel) throw new Error("Rabbit channel not initialized");

    await this.channel.assertQueue(MAIN_QUEUE, {
      durable: true,
      deadLetterExchange: this.config.rabbitmqDlx,
      deadLetterRoutingKey: DLQ_QUEUE
    });

    await this.channel.assertQueue(DLQ_QUEUE, { durable: true });
    await this.channel.bindQueue(DLQ_QUEUE, this.config.rabbitmqDlx, DLQ_QUEUE);

    await this.channel.bindQueue(MAIN_QUEUE, this.config.rabbitmqExchange, RK_RELEASE_REQUESTED);

    await this.channel.assertQueue(RETRY_QUEUE_10S, {
      durable: true,
      messageTtl: 10_000,
      deadLetterExchange: this.config.rabbitmqExchange,
      deadLetterRoutingKey: RK_RELEASE_REQUESTED
    });
  }

  private async handleMessage(msg: amqplib.ConsumeMessage): Promise<void> {
    if (!this.channel) return;

    const headers = (msg.properties.headers ?? {}) as Record<string, unknown>;
    const attempt = (Number(headers["x-attempt"] ?? 0) || 0) + 1;
    const maxRetries = this.config.rabbitmqMaxRetries;

    try {
      const parsed = JSON.parse(msg.content.toString());
      const body = parsed as IntegrationMessage<ReleaseReservationRequestedEvent>;
      await this.useCase.execute(body);
      this.channel.ack(msg);
    } catch {
      if (attempt <= maxRetries) {
        headers["x-attempt"] = attempt;
        this.channel.sendToQueue(RETRY_QUEUE_10S, msg.content, {
          persistent: true,
          contentType: msg.properties.contentType ?? "application/json",
          messageId: msg.properties.messageId,
          correlationId: msg.properties.correlationId,
          headers
        });
        this.channel.ack(msg);
      } else {
        this.channel.nack(msg, false, false);
      }
    }
  }
}
