import { getPrivateNetworkAlias } from "../../domains";

/**
 * Computes the JSON RPC url of an Eth client package from its name
 * Uses default port 8545
 * @param dnpName
 */
export function getEthClientApiUrl(dnpName: string, port = 8545): string {
  /**
   * ```
   * domain = "bitcoin.dappnode", "other.public.dappnode"
   * ```
   */
  const domain = getPrivateNetworkAlias({
    dnpName: dnpName,
    serviceName: dnpName
  });

  return `http://${domain}:${port}`;
}
