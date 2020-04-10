import { RequestData } from "../route-types/ethClientFallbackSet";
import * as db from "../db";
import { RpcHandlerReturn } from "../types";

/**
 * Sets if a fallback should be used
 */
export default async function ethClientFallbackSet({
  fallback
}: RequestData): RpcHandlerReturn {
  db.ethClientFallback.set(fallback);

  return {
    message: "set ethClientFallbackSet"
  };
}
