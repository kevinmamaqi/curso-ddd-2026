import { InventoryIntegrationEvents } from "../domain/events";
import { LineId, Quantity, Sku } from "../domain/value-objects";

export type StockDecision =
  | { kind: "confirmed"; sku: Sku; qty: Quantity; lineId: LineId }
  | { kind: "rejected"; sku: Sku; reason: string; lineId: LineId };

type InventoryLineRouting = Readonly<Record<string, string>>;

export class InventoryAclTranslator {
  constructor(private readonly lineBySku: InventoryLineRouting) {}

  translate(ev: InventoryIntegrationEvents): StockDecision {
    const lineIdRaw = this.lineBySku[ev.payload.sku];
    if (!lineIdRaw) {
      throw new Error("No routing rule for sku -> lineId (ACL mapping).");
    }

    if (ev.type === "StockReserved") {
      return {
        kind: "confirmed",
        sku: Sku.of(ev.payload.sku),
        qty: Quantity.of(ev.payload.qty),
        lineId: LineId.of(lineIdRaw)
      };
    }

    return {
      kind: "rejected",
      sku: Sku.of(ev.payload.sku),
      reason: ev.payload.reason,
      lineId: LineId.of(lineIdRaw)
    };
  }
}

