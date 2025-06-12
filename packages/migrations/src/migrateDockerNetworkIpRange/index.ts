import { logs } from "@dappnode/logger";
import { createDockerNetwork } from "./createDockerNetwork.js";
import { packagesGet } from "@dappnode/installer";
import { dockerComposeUpPackage } from "@dappnode/dockerapi";
import { writeDockerNetworkConfig } from "./writeDockerNetworkConfig.js";

/**
 * Ensures the docker network defined has the following config:
 * - docker network name: "dncore_network"
 * - docker network subnet: "172.33.0.0/16"
 * - dappmanager container has assigned ip: "172.33.1.7"
 * - bind container has assigned ip: "172.33.1.2"
 * - All docker containers prefixed with "DAppnNodeCore-" || "DAppnodePackage-" are connected to it
 * - dappmanager and bind
 */
export async function ensureDockerNetworkConfig({
  networkName,
  subnet,
  dappmanagerContainer,
  bindContainer
}: {
  networkName: string;
  subnet: string;
  dappmanagerContainer: {
    name: string;
    ip: string;
  };
  bindContainer: {
    name: string;
    ip: string;
  };
}): Promise<void> {
  // consider calling packagges get every time to ensure we have the latest packages
  const packages = await packagesGet();

  // 1. create the new docker network
  const network = await createDockerNetwork({
    networkName,
    subnet
  });

  // TODO: order to start with bind and dappmanager containers first
  // this should be done first for bind and dappmanager, then for rest
  for (const pkg of packages) {
    // 2. write the config in the compose file if needed
    writeDockerNetworkConfig({
      pkg,
      networkName,
      subnet
    });
    // 3. compose up --no-recreate
    await dockerComposeUpPackage({
      composeArgs: { dnpName: pkg.dnpName },
      upAll: true,
      dockerComposeUpOptions: { noRecreate: true }
    }).catch((error) =>
      logs.error(`Failed to run docker compose up --no-recreate for package ${pkg.dnpName}: ${error.message}`)
    );

    // 4. connect container to the network
  }

  // 2. write the config in the compose file if needed

  // 3. compose up --no-recreate
  const responses = await Promise.allSettled(
    packages.map(
      async (pkg) =>
        await dockerComposeUpPackage({
          composeArgs: { dnpName: pkg.dnpName },
          upAll: true,
          dockerComposeUpOptions: { noRecreate: true }
        })
    )
  );
  responses.forEach((response, index) => {
    if (response.status === "rejected") {
      logs.error(
        `Failed to run docker compose up --no-recreate for package ${packages[index].dnpName}: ${response.reason}`
      );
    }
  });
}
