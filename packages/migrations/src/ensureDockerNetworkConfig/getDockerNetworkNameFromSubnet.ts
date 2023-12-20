import { docker } from "@dappnode/dockerapi";

/**
 * Get a docker network name from a docker subnetif any, otherwise undefined
 *
 * @param networkSubnet "172.33.0.0/16"
 *
 * @returns "dncore_network" || undefined
 */
export async function getDockerNetworkNameFromSubnet(
  networkSubnet: string
): Promise<string | undefined> {
  const dockerNetworks = await docker.listNetworks();
  return dockerNetworks.find((n) => {
    const nConfig = n.IPAM?.Config;
    return (
      nConfig &&
      nConfig.length > 0 &&
      "Subnet" in nConfig[0] &&
      nConfig[0].Subnet === networkSubnet
    );
  })?.Name;
}
