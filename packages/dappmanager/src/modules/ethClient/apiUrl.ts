import { getPrivateNetworkAlias } from "../../domains";
import { getBeaconServiceName } from "../../modules/stakerConfig/utils";

/**
 * Computes the JSON RPC url of an Eth execution client package from its name
 * Uses default port 8545
 * @param dnpName
 */
export function getEthExecClientApiUrl(dnpName: string, port = 8545): string {
  /**
   * Binded to the domain mapper module 'nsupdate'
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

/**
 * Computes the beacon API url of an Eth consensus client package from its name
 * Uses default port 3500
 * @param dnpName
 */
export function getEthConsClientApiUrl(dnpName: string, port = 3500): string {
  /**
   * Binded to the domain mapper module 'nsupdate'
   * ```
   * domain = "bitcoin.dappnode", "other.public.dappnode"
   * ```
   */
  const domain = getPrivateNetworkAlias({
    dnpName: dnpName,
    serviceName: getBeaconServiceName(dnpName)
  });

  return `http://${domain}:${port}`;
}
