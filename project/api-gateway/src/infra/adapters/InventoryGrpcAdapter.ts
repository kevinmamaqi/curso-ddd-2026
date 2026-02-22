import { InventoryServicePort, InventoryStockView } from "../../application/ports/InventoryServicePort";
import { grpcUnary, loadGrpcPackages } from "./grpc/proto";

export class InventoryGrpcAdapter implements InventoryServicePort {
  private readonly client: any;

  constructor(private readonly address: string) {
    const { grpc, inventory } = loadGrpcPackages();
    this.client = new inventory.InventoryService(
      address,
      grpc.credentials.createInsecure()
    );
  }

  async getStock(sku: string): Promise<InventoryStockView | null> {
    try {
      const res = await grpcUnary<any, any>(this.client.GetStock.bind(this.client), { sku });
      return res as InventoryStockView;
    } catch (err: any) {
      if (err?.code === 5) return null; // NOT_FOUND
      throw err;
    }
  }

  async reserveStock(params: { sku: string; reservationId: string; qty: number }): Promise<void> {
    await grpcUnary<any, any>(this.client.ReserveStock.bind(this.client), {
      sku: params.sku,
      reservationId: params.reservationId,
      qty: params.qty
    });
  }

  async releaseReservation(params: { sku: string; reservationId: string }): Promise<void> {
    await grpcUnary<any, any>(this.client.ReleaseReservation.bind(this.client), {
      sku: params.sku,
      reservationId: params.reservationId
    });
  }

  async replenishStock(params: { sku: string; qty: number }): Promise<void> {
    await grpcUnary<any, any>(this.client.ReplenishStock.bind(this.client), {
      sku: params.sku,
      qty: params.qty
    });
  }
}

