import { getDotDappnodeDomain } from "../nsupdate";

/**
 * Computes the JSON RPC url of an Eth client package from its name
 * Uses default port 8545
 * @param dnpName
 */
export function getEthClientApiUrl(dnpName: string, port = 8545): string {
  /**
   * Binded to the domain mapper module 'nsupdate'
   * ```
   * domain = "bitcoin.dappnode", "other.public.dappnode"
   * ```
   */
  const domain = getDotDappnodeDomain(dnpName);
  return `http://${domain}:${port}`;
}
