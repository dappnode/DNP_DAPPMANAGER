import * as db from "../db";
import { IpfsFallback } from "../types";

/**
 * Sets if a fallback should be used for IPFS
 */
export async function ipfsFallbackSet({
  fallback
}: {
  fallback: IpfsFallback;
}): Promise<void> {
  db.ipfsFallback.set(fallback);
}
