import { metrics } from "@opentelemetry/api";

type ConsumerMessagingMetrics = {
  consumedTotal: any;
  consumeDurationMs: any;
};

type OutboxMetrics = {
  outboxPublishedTotal: any;
  outboxPublishDurationMs: any;
};

let consumerMetrics: ConsumerMessagingMetrics | undefined;
let outboxMetrics: OutboxMetrics | undefined;

export function getConsumerMessagingMetrics(): ConsumerMessagingMetrics {
  if (consumerMetrics) return consumerMetrics;

  const meter = metrics.getMeter("eda-messaging");
  consumerMetrics = {
    consumedTotal: meter.createCounter("eda_consumer_messages_total", {
      description: "Count of consumed RabbitMQ messages",
      unit: "1"
    }),
    consumeDurationMs: meter.createHistogram("eda_consumer_duration_ms", {
      description: "RabbitMQ consumer message handling duration",
      unit: "ms"
    })
  };

  return consumerMetrics;
}

export function getOutboxMetrics(): OutboxMetrics {
  if (outboxMetrics) return outboxMetrics;

  const meter = metrics.getMeter("eda-messaging");
  outboxMetrics = {
    outboxPublishedTotal: meter.createCounter("eda_outbox_published_total", {
      description: "Count of messages published by the outbox publisher",
      unit: "1"
    }),
    outboxPublishDurationMs: meter.createHistogram("eda_outbox_publish_duration_ms", {
      description: "Outbox publish+confirm+markSent duration",
      unit: "ms"
    })
  };

  return outboxMetrics;
}

