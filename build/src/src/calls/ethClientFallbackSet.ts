import { RequestData } from "../route-types/ethClientFallbackSet";
import * as db from "../db";

/**
 * Sets if a fallback should be used
 */
export default async function ethClientFallbackSet({
  fallback
}: RequestData): Promise<void> {
  db.ethClientFallback.set(fallback);
}
