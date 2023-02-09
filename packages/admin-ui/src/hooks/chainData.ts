import { useApi } from "api";
import { ChainData } from "@dappnode/common";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { getRepositorySourceChainItem } from "services/dappnodeStatus/selectors";

/**
 * Fetches chainData from api.chainDataGet() and repository status from redux
 *
 * Common function for
 * - top nav bar dropdown chains
 * - Dashboard chains
 */
export function useChainData(): ChainData[] {
  const repositorySourceChainItem = useSelector(getRepositorySourceChainItem);
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

  return repositorySourceChainItem
    ? [repositorySourceChainItem, ...chainDataRes.data]
    : chainDataRes.data;
}
