export type ReservationRecord = Readonly<{
  reservationId: string;
  sku: string;
  qty: number;
  releasedAt?: string;
  createdAt: string;
}>;

export interface ReservationRepositoryPort {
  initSchema(): Promise<void>;

  tryCreate(params: { reservationId: string; sku: string; qty: number }): Promise<boolean>;

  getActiveQty(params: { reservationId: string; sku: string }): Promise<number | null>;

  markReleased(params: { reservationId: string; sku: string }): Promise<boolean>;

  listByReservationId(reservationId: string): Promise<ReservationRecord[]>;
}

