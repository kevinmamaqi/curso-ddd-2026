import {
  FulfillmentOrderView,
  FulfillmentServicePort,
  PickList,
  PlaceOrderInput
} from "../../application/ports/FulfillmentServicePort";
import { grpcUnary, loadGrpcPackages } from "./grpc/proto";
import * as grpc from "@grpc/grpc-js";

function makeMetadata(opts?: { correlationId?: string }): grpc.Metadata | undefined {
  if (!opts?.correlationId) return undefined;
  const m = new grpc.Metadata();
  m.add("x-correlation-id", opts.correlationId);
  return m;
}

export class FulfillmentGrpcAdapter implements FulfillmentServicePort {
  private readonly client: any;

  constructor(private readonly address: string) {
    const { grpc: g, fulfillment } = loadGrpcPackages();
    this.client = new fulfillment.FulfillmentService(
      address,
      g.credentials.createInsecure()
    );
  }

  async placeOrder(input: PlaceOrderInput, opts?: { correlationId?: string }): Promise<void> {
    await grpcUnary<any, any>(
      this.client.PlaceOrder.bind(this.client),
      input,
      makeMetadata(opts)
    );
  }

  async getOrder(orderId: string, opts?: { correlationId?: string }): Promise<FulfillmentOrderView | null> {
    try {
      const res = await grpcUnary<any, any>(
        this.client.GetOrder.bind(this.client),
        { orderId },
        makeMetadata(opts)
      );
      const view = res as FulfillmentOrderView;
      return {
        ...view,
        reservationId: view.reservationId || undefined
      };
    } catch (err: any) {
      if (err?.code === 5) return null; // NOT_FOUND
      throw err;
    }
  }

  async cancelOrder(orderId: string, opts?: { correlationId?: string }): Promise<void> {
    await grpcUnary<any, any>(
      this.client.CancelOrder.bind(this.client),
      { orderId },
      makeMetadata(opts)
    );
  }

  async getPickList(orderId: string, opts?: { correlationId?: string }): Promise<PickList | null> {
    try {
      const res = await grpcUnary<any, any>(
        this.client.GetPickList.bind(this.client),
        { orderId },
        makeMetadata(opts)
      );
      return res as PickList;
    } catch (err: any) {
      if (err?.code === 5) return null;
      throw err;
    }
  }
}

