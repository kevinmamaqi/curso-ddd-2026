export type Health = Readonly<{
  ok: boolean;
  inventory: "ok" | "down";
  fulfillment: "ok" | "down";
}>;

export class HealthCheckUseCase {
  constructor(
    private readonly checkInventory: () => Promise<boolean>,
    private readonly checkFulfillment: () => Promise<boolean>
  ) {}

  async execute(): Promise<Health> {
    const [inv, ful] = await Promise.allSettled([this.checkInventory(), this.checkFulfillment()]);
    const inventoryOk = inv.status === "fulfilled" && inv.value;
    const fulfillmentOk = ful.status === "fulfilled" && ful.value;
    return {
      ok: inventoryOk && fulfillmentOk,
      inventory: inventoryOk ? "ok" : "down",
      fulfillment: fulfillmentOk ? "ok" : "down"
    };
  }
}

