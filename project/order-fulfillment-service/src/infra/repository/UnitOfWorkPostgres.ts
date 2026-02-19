import { UnitOfWorkPort } from "../../application/ports";
import { DBClient } from "./pg";

export class UnitOfWorkPostgres implements UnitOfWorkPort {
  constructor(private readonly dbClient: DBClient) {}

  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return await this.dbClient.transaction(fn);
  }
}

