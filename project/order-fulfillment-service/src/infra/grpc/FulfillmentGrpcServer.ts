import fs from "node:fs";
import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { AppConfig } from "../../config/config";
import { PlaceOrderUseCase } from "../../application/place-order-use-case";
import { CancelOrderUseCase } from "../../application/CancelOrderUseCase";
import { GetPickListQuery } from "../../application/GetPickListQuery";
import { FulfillmentOrderRepositoryPort } from "../../application/ports";
import { OrderId } from "../../domain/value-objects";

function resolveProtosDir(): string {
  const candidates = [
    process.env.PROTOS_DIR,
    path.resolve(process.cwd(), "protos"),
    path.resolve(process.cwd(), "..", "protos")
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "fulfillment.proto"))) return dir;
  }
  throw new Error("Could not resolve protos dir (missing fulfillment.proto).");
}

export class FulfillmentGrpcServer {
  private server?: grpc.Server;

  constructor(
    private readonly config: AppConfig,
    private readonly placeOrderUseCase: PlaceOrderUseCase,
    private readonly repo: FulfillmentOrderRepositoryPort,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly getPickListQuery: GetPickListQuery
  ) {}

  async start(): Promise<void> {
    if (this.server) return;

    const protosDir = resolveProtosDir();
    const packageDef = protoLoader.loadSync(path.join(protosDir, "fulfillment.proto"), {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [protosDir]
    });

    const loaded = grpc.loadPackageDefinition(packageDef) as any;
    const svc = loaded.course.fulfillment.v1.FulfillmentService;

    const server = new grpc.Server();
    server.addService(svc.service, {
      PlaceOrder: async (call: any, cb: any) => {
        try {
          await this.placeOrderUseCase.execute({
            orderId: String(call.request?.orderId ?? ""),
            reservationId: String(call.request?.reservationId ?? ""),
            lines: Array.isArray(call.request?.lines)
              ? call.request.lines.map((l: any) => ({
                  lineId: String(l.lineId ?? ""),
                  sku: String(l.sku ?? ""),
                  qty: Number(l.qty ?? 0)
                }))
              : []
          });
          return cb(null, {});
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid request";
          return cb({ code: grpc.status.INVALID_ARGUMENT, message }, null);
        }
      },
      GetOrder: async (call: any, cb: any) => {
        try {
          const orderId = String(call.request?.orderId ?? "");
          const order = await this.repo.getById(OrderId.of(orderId));
          if (!order) {
            return cb({ code: grpc.status.NOT_FOUND, message: "Order not found" }, null);
          }
          return cb(null, {
            orderId: order.id.toString(),
            status: order.getStatus(),
            reservationId: order.getReservationId() ?? ""
          });
        } catch {
          return cb({ code: grpc.status.INTERNAL, message: "Unexpected error" }, null);
        }
      },
      CancelOrder: async (call: any, cb: any) => {
        try {
          const orderId = String(call.request?.orderId ?? "");
          await this.cancelOrderUseCase.execute({ orderId });
          return cb(null, {});
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid request";
          const code = message === "Order not found" ? grpc.status.NOT_FOUND : grpc.status.INVALID_ARGUMENT;
          return cb({ code, message }, null);
        }
      },
      GetPickList: async (call: any, cb: any) => {
        try {
          const orderId = String(call.request?.orderId ?? "");
          const out = await this.getPickListQuery.execute({ orderId });
          if (!out) {
            return cb({ code: grpc.status.NOT_FOUND, message: "Order not found" }, null);
          }
          return cb(null, out);
        } catch {
          return cb({ code: grpc.status.INTERNAL, message: "Unexpected error" }, null);
        }
      }
    });

    await new Promise<void>((resolve, reject) => {
      server.bindAsync(
        `0.0.0.0:${this.config.grpcPort}`,
        grpc.ServerCredentials.createInsecure(),
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    server.start();
    this.server = server;
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    const server = this.server;
    this.server = undefined;
    await new Promise<void>((resolve) => server.tryShutdown(() => resolve()));
  }
}

