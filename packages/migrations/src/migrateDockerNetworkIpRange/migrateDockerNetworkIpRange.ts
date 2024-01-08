import { getNetworkAliasesIpsMapNotThrow } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { connectContainersToNetworkWithPrio } from "./connectContainersToNetworkWithPrio/index.js";
import { ensureDockerNetworkConfig } from "./ensureDockerNetworkConfig/index.js";
import { restartWireguardNotThrow } from "./restartWireguardNotThrow.js";

/**
 * Ensures the docker network defined has the following config:
 * - docker network name: "dncore_network"
 * - docker network subnet: "172.33.0.0/16"
 * - dappmanager container has assigned ip: "172.33.1.7"
 * - bind container has assigned ip: "172.33.1.2"
 * - All docker containers prefixed with "DAppnNodeCore-" || "DAppnodePackage-" are connected to it
 * - dappmanager and bind
 */
export async function migrateDockerNetworkIpRange({
  dockerNetworkName,
  dockerNetworkSubnet,
  dappmanagerContainer,
  bindContainer,
}: {
  dockerNetworkName: string;
  dockerNetworkSubnet: string;
  dappmanagerContainer: {
    name: string;
    ip: string;
  };
  bindContainer: {
    name: string;
    ip: string;
  };
}): Promise<void> {
  const aliasesIpsMap = await getNetworkAliasesIpsMapNotThrow(
    dockerNetworkName
  );
  const {
    network,
    containersToRestart,
    containersToRecreate,
    isNetworkRecreated,
  } = await ensureDockerNetworkConfig({
    networkName: dockerNetworkName,
    networkSubnet: dockerNetworkSubnet,
    aliasesIpsMap,
  });

  try {
    await connectContainersToNetworkWithPrio({
      network,
      dappmanagerContainer,
      bindContainer,
      aliasesIpsMap,
      containersToRestart,
      containersToRecreate,
    });
  } catch (e) {
    logs.error(`Failed to connect containers to network ${dockerNetworkName}`);
    // TODO: What do we do here?
    throw e;
  } finally {
    if (isNetworkRecreated) await restartWireguardNotThrow();
  }
}
