import { buildNetworkAlias } from "@dappnode/utils";
import { listPackageNoThrow } from "@dappnode/dockerapi";

/**
 * Computes the JSON RPC url of an Eth execution client package from its name
 * Uses default port 8545
 * @param dnpName
 */
export function getEthExecClientApiUrl(dnpName: string, port = 8545): string {
  /**
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
  const defaultPort = 3500;
  const defaultServiceName = "beacon-chain";

  const dnp = await listPackageNoThrow({ dnpName });

  if (!dnp || typeof dnp.chain !== "object") {
    const domain = buildNetworkAlias({
      dnpName,
      serviceName: defaultServiceName,
      isMainOrMonoservice: false
    });

    return `http://${domain}:${defaultPort}`;
  }

  const { chain: { portNumber = defaultPort, serviceName = defaultServiceName } = {} } = dnp;

  const domain = buildNetworkAlias({
    dnpName,
    serviceName,
    isMainOrMonoservice: false
  });

  return `http://${domain}:${portNumber}`;
}
