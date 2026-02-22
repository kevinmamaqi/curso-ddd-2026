import { ReservationRepositoryPort } from "./ports/ReservationRepositoryPort";

export type GetReservationsByReservationIdQueryInput = Readonly<{
  reservationId: string;
}>;

export class GetReservationsByReservationIdQuery {
  constructor(private readonly reservationRepo: ReservationRepositoryPort) {}

  async execute(input: GetReservationsByReservationIdQueryInput) {
    return await this.reservationRepo.listByReservationId(input.reservationId);
  }
}

