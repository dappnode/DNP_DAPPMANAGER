import { buildNetworkAlias } from "@dappnode/utils";
import { getBeaconServiceName } from "../../modules/stakerConfig/utils.js";
import { listPackageNoThrow } from "@dappnode/dockerapi";

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
  const containerDomain = buildNetworkAlias({
    dnpName,
    serviceName: "",
    isMainOrMonoservice: true
  });

  return `http://${containerDomain}:${port}`;
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
    domain = buildNetworkAlias({
      dnpName: dnpName,
      serviceName: dnp.chain.serviceName,
      isMainOrMonoservice: false
    });
  } else {
    // Lighthouse, Teku and Prysm use 3500
    // Nimbus uses 4500 because it is a monoservice and the validator API is using that port
    if (dnpName.includes("nimbus")) {
      port = 4500;
    }
    domain = buildNetworkAlias({
      dnpName: dnpName,
      serviceName: getBeaconServiceName(dnpName),
      isMainOrMonoservice: false
    });
  }
  return `http://${domain}:${port}`;
}
