export interface UnitOfWorkPort {
  runInTransaction<T>(fn: () => Promise<T>): Promise<T>;
}

