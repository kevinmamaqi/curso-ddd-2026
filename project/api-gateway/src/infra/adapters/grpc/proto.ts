import fs from "node:fs";
import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

function resolveProtosDir(): string {
  const candidates = [
    process.env.PROTOS_DIR,
    path.resolve(process.cwd(), "protos"),
    path.resolve(process.cwd(), "..", "protos")
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "inventory.proto")) && fs.existsSync(path.join(dir, "fulfillment.proto"))) {
      return dir;
    }
  }
  throw new Error("Could not resolve protos dir.");
}

export function loadGrpcPackages(): {
  grpc: typeof grpc;
  inventory: any;
  fulfillment: any;
} {
  const protosDir = resolveProtosDir();

  const load = (file: string) =>
    protoLoader.loadSync(path.join(protosDir, file), {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [protosDir]
    });

  const inv = grpc.loadPackageDefinition(load("inventory.proto")) as any;
  const ful = grpc.loadPackageDefinition(load("fulfillment.proto")) as any;

  return {
    grpc,
    inventory: inv.course.inventory.v1,
    fulfillment: ful.course.fulfillment.v1
  };
}

export function grpcUnary<TReq, TRes>(
  fn: (req: TReq, cb: (err: any, res: TRes) => void) => void,
  req: TReq
): Promise<TRes> {
  return new Promise((resolve, reject) => {
    fn(req, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

