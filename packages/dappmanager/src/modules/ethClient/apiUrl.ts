import { getDotDappnodeDomain } from "../../watchers/nsupdate/utils";

/**
 * Computes the JSON RPC url of an Eth client package from its name
 * Uses default port 8545
 * @param name
 */
export function getEthClientApiUrl(name: string, port = 8545): string {
  /**
   * Binded to the domain mapper module 'nsupdate'
   * ```
   * domain = "bitcoin.dappnode", "other.public.dappnode"
   * ```
   */
  const domain = getDotDappnodeDomain(name);
  return `http://${domain}:${port}`;
}
