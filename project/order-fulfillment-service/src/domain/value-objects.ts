export class OrderId {
  private static readonly pattern = /^ORDER-\d{6}$/;
  private constructor(private readonly value: string) {}

  static of(raw: string): OrderId {
    if (!OrderId.pattern.test(raw)) {
      throw new Error("OrderId must match ORDER-000001.");
    }
    return new OrderId(raw);
  }

  toString(): string {
    return this.value;
  }
}

export class LineId {
  private static readonly pattern = /^LINE-\d{4}$/;
  private constructor(private readonly value: string) {}

  static of(raw: string): LineId {
    if (!LineId.pattern.test(raw)) {
      throw new Error("LineId must match LINE-0001.");
    }
    return new LineId(raw);
  }

  toString(): string {
    return this.value;
  }
}

export class Sku {
  private static readonly pattern = /^BOOK-\d{4}$/;
  private constructor(private readonly value: string) {}

  static of(raw: string): Sku {
    if (!Sku.pattern.test(raw)) {
      throw new Error("Sku must match BOOK-0001.");
    }
    return new Sku(raw);
  }

  toString(): string {
    return this.value;
  }
}

export class Quantity {
  private constructor(private readonly value: number) {}

  static of(n: number): Quantity {
    if (!Number.isInteger(n) || n <= 0) {
      throw new Error("Quantity must be a positive integer.");
    }
    return new Quantity(n);
  }

  toNumber(): number {
    return this.value;
  }
}

