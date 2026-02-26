import * as amqplib from "amqplib";
import { AppConfig } from "../../config/config";
import { HandleInventoryIntegrationEventUseCase } from "../../application/HandleInventoryIntegrationEventUseCase";
import { assertTopology, connectRabbit, createChannel } from "./rabbitmq";
import { IntegrationMessage, InventoryIntegrationEvents } from "../../domain/events";
import { getConsumerMessagingMetrics } from "../observability/messagingMetrics";
import { ROOT_CONTEXT, context, propagation } from "@opentelemetry/api";
import type { FastifyBaseLogger } from "fastify";

const MAIN_QUEUE = "fulfillment.inventory_results.v1";
const DLQ_QUEUE = "fulfillment.inventory_results.dlq";

const RK_STOCK_RESERVED = "inventory.stock-reserved.v1";
const RK_STOCK_REJECTED = "inventory.stock-rejected.v1";

const RETRY_QUEUE_RESERVED_10S = "fulfillment.inventory_results.stock_reserved.retry.10s";
const RETRY_QUEUE_REJECTED_10S = "fulfillment.inventory_results.stock_rejected.retry.10s";

export class InventoryResultsRabbitConsumer {
  private conn?: amqplib.ChannelModel;
  private channel?: amqplib.Channel;
  private consumerTag?: string;

  constructor(
    private readonly config: AppConfig,
    private readonly useCase: HandleInventoryIntegrationEventUseCase,
    private readonly logger: FastifyBaseLogger
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
    this.logger.info({ queue: MAIN_QUEUE, consumerTag: res.consumerTag }, "InventoryResultsRabbitConsumer.started");
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

    await this.channel.bindQueue(MAIN_QUEUE, this.config.rabbitmqExchange, RK_STOCK_RESERVED);
    await this.channel.bindQueue(MAIN_QUEUE, this.config.rabbitmqExchange, RK_STOCK_REJECTED);

    await this.channel.assertQueue(RETRY_QUEUE_RESERVED_10S, {
      durable: true,
      messageTtl: 10_000,
      deadLetterExchange: this.config.rabbitmqExchange,
      deadLetterRoutingKey: RK_STOCK_RESERVED
    });
    await this.channel.assertQueue(RETRY_QUEUE_REJECTED_10S, {
      durable: true,
      messageTtl: 10_000,
      deadLetterExchange: this.config.rabbitmqExchange,
      deadLetterRoutingKey: RK_STOCK_REJECTED
    });
  }

  private async handleMessage(msg: amqplib.ConsumeMessage): Promise<void> {
    if (!this.channel) return;

    const startNs = process.hrtime.bigint();
    const headers = (msg.properties.headers ?? {}) as Record<string, unknown>;
    const attempt = (Number(headers["x-attempt"] ?? 0) || 0) + 1;
    const maxRetries = this.config.rabbitmqMaxRetries;
    const correlationId = msg.properties.correlationId?.toString() ?? "unknown";
    const messageId = msg.properties.messageId?.toString() ?? "unknown";

    const retryQueue =
      msg.fields.routingKey === RK_STOCK_RESERVED
        ? RETRY_QUEUE_RESERVED_10S
        : RETRY_QUEUE_REJECTED_10S;

    const parentCtx = propagation.extract(ROOT_CONTEXT, this.normalizeHeaders(msg.properties.headers));
    await context.with(parentCtx, async () => {
      this.logger.info(
        { queue: MAIN_QUEUE, messageId, correlationId, attempt, routingKey: msg.fields.routingKey },
        "InventoryResultsRabbitConsumer.message_received"
      );

      try {
        const { consumedTotal } = getConsumerMessagingMetrics();
        const parsed = JSON.parse(msg.content.toString());
        const body = parsed as IntegrationMessage<InventoryIntegrationEvents>;
        await this.useCase.execute(body);
        this.channel!.ack(msg);

        this.logger.info(
          { queue: MAIN_QUEUE, messageId, correlationId, attempt },
          "InventoryResultsRabbitConsumer.message_acked"
        );

        consumedTotal.add(1, {
          service: this.config.otelServiceName,
          queue: MAIN_QUEUE,
          routing_key: msg.fields.routingKey,
          outcome: "ok",
          attempt: String(attempt)
        });
      } catch (err) {
        const { consumedTotal } = getConsumerMessagingMetrics();
        const errorType = err instanceof SyntaxError ? "json_parse" : "handler";
        const reason = err instanceof Error ? err.message : String(err);

        this.logger.error(
          {
            queue: MAIN_QUEUE,
            messageId,
            correlationId,
            attempt,
            maxRetries,
            errorType,
            reason,
            stack: err instanceof Error ? err.stack : undefined
          },
          "InventoryResultsRabbitConsumer.message_failed"
        );

        if (attempt <= maxRetries) {
          headers["x-attempt"] = attempt;
          this.channel!.sendToQueue(retryQueue, msg.content, {
            persistent: true,
            contentType: msg.properties.contentType ?? "application/json",
            messageId: msg.properties.messageId,
            correlationId: msg.properties.correlationId,
            headers
          });
          this.channel!.ack(msg);

          this.logger.error(
            { queue: MAIN_QUEUE, messageId, correlationId, attempt, nextAttempt: attempt + 1, retryQueue },
            "InventoryResultsRabbitConsumer.message_retry_scheduled"
          );

          consumedTotal.add(1, {
            service: this.config.otelServiceName,
            queue: MAIN_QUEUE,
            routing_key: msg.fields.routingKey,
            outcome: "retry",
            attempt: String(attempt),
            error_type: errorType
          });
        } else {
          this.channel!.nack(msg, false, false);

          this.logger.error(
            { queue: MAIN_QUEUE, messageId, correlationId, attempt, dlq: DLQ_QUEUE },
            "InventoryResultsRabbitConsumer.message_sent_to_dlq"
          );

          consumedTotal.add(1, {
            service: this.config.otelServiceName,
            queue: MAIN_QUEUE,
            routing_key: msg.fields.routingKey,
            outcome: "dlq",
            attempt: String(attempt),
            error_type: errorType
          });
        }
      } finally {
        const endNs = process.hrtime.bigint();
        const durationMs = Number(endNs - startNs) / 1e6;
        const { consumeDurationMs } = getConsumerMessagingMetrics();
        consumeDurationMs.record(durationMs, {
          service: this.config.otelServiceName,
          queue: MAIN_QUEUE,
          routing_key: msg.fields.routingKey
        });
      }
    });
  }

  private normalizeHeaders(headers: amqplib.MessageProperties["headers"]): Record<string, string> {
    const result: Record<string, string> = {};
    const source = (headers ?? {}) as Record<string, unknown>;
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === "string") {
        result[key] = value;
      } else if (Buffer.isBuffer(value)) {
        result[key] = value.toString("utf8");
      }
    }
    return result;
  }
}
