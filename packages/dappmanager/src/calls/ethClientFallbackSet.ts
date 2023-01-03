import * as db from "../db";
import { EthClientFallback } from "@dappnode/common";

/**
 * Sets if a fallback should be used
 */
export async function ethClientFallbackSet({
  fallback
}: {
  fallback: EthClientFallback;
}): Promise<void> {
  db.ethClientFallback.set(fallback);
}
