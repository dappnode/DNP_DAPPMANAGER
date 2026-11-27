/**
 * Log callback injected by the host application. The toolkit must not depend on
 * `@dappnode/logger`, so content providers report through this callback instead.
 */
export type ContentLog = (level: "debug" | "warn", message: string) => void;

export const noopLog: ContentLog = () => undefined;

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
