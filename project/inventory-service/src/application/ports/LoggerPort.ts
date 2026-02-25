export type LoggerPort = Readonly<{
  debug: (obj: unknown, msg?: string) => void;
  info: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
}>;

export const noopLogger: LoggerPort = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined
};

