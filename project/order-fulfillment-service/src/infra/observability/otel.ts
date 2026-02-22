import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { AmqplibInstrumentation } from "@opentelemetry/instrumentation-amqplib";

export async function startOtel(params: {
  serviceName: string;
  otlpEndpoint: string;
  metricsPort: number;
}): Promise<NodeSDK> {
  const traceExporter = new OTLPTraceExporter({
    url: `${params.otlpEndpoint}/v1/traces`
  });

  const prometheusExporter = new PrometheusExporter({
    host: "0.0.0.0",
    port: params.metricsPort,
    endpoint: "/metrics"
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: params.serviceName
    }),
    traceExporter,
    metricReader: prometheusExporter,
    instrumentations: [
      new AmqplibInstrumentation(),
      ...getNodeAutoInstrumentations()
    ]
  });

  await sdk.start();
  return sdk;
}
