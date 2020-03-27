import { RequestData } from "../route-types/ethClientFallbackSet";
import * as db from "../db";
import { RpcHandlerReturn } from "../types";

/**
 * Sets if a fallback should be used
 */
export default async function ethClientFallbackSet({
  fallbackOn
}: RequestData): RpcHandlerReturn {
  db.ethClientFallbackOn.set(fallbackOn);

  return {
    message: "set ethClientFallbackSet"
  };
}
