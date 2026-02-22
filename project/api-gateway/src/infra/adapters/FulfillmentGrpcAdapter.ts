import {
  FulfillmentOrderView,
  FulfillmentServicePort,
  PickList,
  PlaceOrderInput
} from "../../application/ports/FulfillmentServicePort";
import { grpcUnary, loadGrpcPackages } from "./grpc/proto";

export class FulfillmentGrpcAdapter implements FulfillmentServicePort {
  private readonly client: any;

  constructor(private readonly address: string) {
    const { grpc, fulfillment } = loadGrpcPackages();
    this.client = new fulfillment.FulfillmentService(
      address,
      grpc.credentials.createInsecure()
    );
  }

  async placeOrder(input: PlaceOrderInput): Promise<void> {
    await grpcUnary<any, any>(this.client.PlaceOrder.bind(this.client), input);
  }

  async getOrder(orderId: string): Promise<FulfillmentOrderView | null> {
    try {
      const res = await grpcUnary<any, any>(this.client.GetOrder.bind(this.client), { orderId });
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

  async cancelOrder(orderId: string): Promise<void> {
    await grpcUnary<any, any>(this.client.CancelOrder.bind(this.client), { orderId });
  }

  async getPickList(orderId: string): Promise<PickList | null> {
    try {
      const res = await grpcUnary<any, any>(this.client.GetPickList.bind(this.client), { orderId });
      return res as PickList;
    } catch (err: any) {
      if (err?.code === 5) return null;
      throw err;
    }
  }
}

