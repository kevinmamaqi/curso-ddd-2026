import { metrics } from "@opentelemetry/api";

type BusinessMetrics = {
  ordersPlacedTotal: any;
};

let businessMetrics: BusinessMetrics | undefined;

function getBusinessMetrics(): BusinessMetrics {
  if (businessMetrics) return businessMetrics;

  const meter = metrics.getMeter("business");
  businessMetrics = {
    ordersPlacedTotal: meter.createCounter("orders_placed_total", {
      description: "Count of accepted order placements",
      unit: "1"
    })
  };

  return businessMetrics;
}

export function recordOrderPlaced(params: {
  serviceName: string;
  outcome: "accepted" | "error";
}): void {
  const { ordersPlacedTotal } = getBusinessMetrics();
  ordersPlacedTotal.add(1, { service: params.serviceName, outcome: params.outcome });
}

