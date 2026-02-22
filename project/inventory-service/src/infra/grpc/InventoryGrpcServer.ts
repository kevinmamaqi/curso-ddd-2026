import fs from "node:fs";
import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { AppConfig } from "../../config/config";
import { GetInventoryBySkuQuery } from "../../application/GetInventoryBySkuQuery";
import { ReserveBookUseCase } from "../../application/ReserveBookUseCase";
import { ReplenishStockUseCase } from "../../application/ReplenishStockUseCase";
import { ReleaseReservationUseCase } from "../../application/ReleaseReservationUseCase";

function resolveProtosDir(): string {
  const candidates = [
    process.env.PROTOS_DIR,
    path.resolve(process.cwd(), "protos"),
    path.resolve(process.cwd(), "..", "protos")
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "inventory.proto"))) return dir;
  }
  throw new Error("Could not resolve protos dir (missing inventory.proto).");
}

export class InventoryGrpcServer {
  private server?: grpc.Server;

  constructor(
    private readonly config: AppConfig & { grpcPort?: number },
    private readonly getInventoryBySkuQuery: GetInventoryBySkuQuery,
    private readonly reserveBookUseCase: ReserveBookUseCase,
    private readonly replenishStockUseCase: ReplenishStockUseCase,
    private readonly releaseReservationUseCase: ReleaseReservationUseCase
  ) {}

  async start(): Promise<void> {
    if (this.server) return;
    const grpcPort = Number((this.config as any).grpcPort ?? process.env.GRPC_PORT ?? 50051);

    const protosDir = resolveProtosDir();
    const packageDef = protoLoader.loadSync(path.join(protosDir, "inventory.proto"), {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [protosDir]
    });

    const loaded = grpc.loadPackageDefinition(packageDef) as any;
    const svc = loaded.course.inventory.v1.InventoryService;

    const server = new grpc.Server();
    server.addService(svc.service, {
      GetStock: async (call: any, cb: any) => {
        try {
          const sku = String(call.request?.sku ?? "");
          const view = await this.getInventoryBySkuQuery.execute({ sku });
          if (!view) {
            return cb({ code: grpc.status.NOT_FOUND, message: "Stock not found" }, null);
          }
          return cb(null, view);
        } catch (err) {
          return cb({ code: grpc.status.INTERNAL, message: "Unexpected error" }, null);
        }
      },
      ReserveStock: async (call: any, cb: any) => {
        try {
          const sku = String(call.request?.sku ?? "");
          const reservationId = String(call.request?.reservationId ?? "");
          const qty = Number(call.request?.qty ?? 0);
          await this.reserveBookUseCase.execute({ bookId: sku, quantity: qty, reservationId });
          return cb(null, {});
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid request";
          return cb({ code: grpc.status.INVALID_ARGUMENT, message }, null);
        }
      },
      ReleaseReservation: async (call: any, cb: any) => {
        try {
          const sku = String(call.request?.sku ?? "");
          const reservationId = String(call.request?.reservationId ?? "");
          await this.releaseReservationUseCase.execute({ sku, reservationId });
          return cb(null, {});
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid request";
          return cb({ code: grpc.status.INVALID_ARGUMENT, message }, null);
        }
      },
      ReplenishStock: async (call: any, cb: any) => {
        try {
          const sku = String(call.request?.sku ?? "");
          const qty = Number(call.request?.qty ?? 0);
          await this.replenishStockUseCase.execute({ sku, quantity: qty });
          return cb(null, {});
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid request";
          return cb({ code: grpc.status.INVALID_ARGUMENT, message }, null);
        }
      }
    });

    await new Promise<void>((resolve, reject) => {
      server.bindAsync(
        `0.0.0.0:${grpcPort}`,
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

