import * as db from "@dappnode/db";
import { EthClientFallback } from "@dappnode/types";

/**
 * Sets if a fallback should be used
 */
export async function ethClientFallbackSet({ fallback }: { fallback: EthClientFallback }): Promise<void> {
  db.ethClientFallback.set(fallback);
}
