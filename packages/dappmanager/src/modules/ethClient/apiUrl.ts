import { getPrivateNetworkAlias } from "../../domains.js";
import { getBeaconServiceName } from "../../modules/stakerConfig/utils.js";
import { listPackageNoThrow } from "../docker/list/index.js";

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
export async function getEthConsClientApiUrl(dnpName: string): Promise<string> {
  let port = 3500;
  let domain = "";
  const dnp = await listPackageNoThrow({ dnpName });
  if (
    dnp &&
    typeof dnp.chain === "object" &&
    dnp.chain.portNumber &&
    dnp.chain.serviceName
  ) {
    port = dnp.chain.portNumber;
    domain = getPrivateNetworkAlias({
      dnpName: dnpName,
      serviceName: dnp.chain.serviceName
    });
  } else {
    // Lighthouse, Teku and Prysm use 3500
    // Nimbus uses 4500 because it is a monoservice and the validator API is using that port
    if (dnpName.includes("nimbus")) {
      port = 4500;
    }
    domain = getPrivateNetworkAlias({
      dnpName: dnpName,
      serviceName: getBeaconServiceName(dnpName)
    });
  }
  return `http://${domain}:${port}`;
}
