import { useApi } from "api";
import { ChainData } from "@dappnode/types";
import { useEffect } from "react";

/**
 * Fetches chainData from api.chainDataGet() and repository status from redux
 *
 * Common function for
 * - top nav bar dropdown chains
 * - Dashboard chains
 */
export function useChainData(): ChainData[] {
  const chainDataRes = useApi.chainDataGet();

  useEffect(() => {
    const interval = setInterval(chainDataRes.revalidate, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [chainDataRes]);

  if (!chainDataRes.data) {
    return [];
  }

  return chainDataRes.data;
}
