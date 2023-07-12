import { httpsPortal } from "../../../calls/index.js";
import { InstallPackageData } from "@dappnode/common";
import { getExternalNetworkAlias } from "../../../domains.js";
import params from "../../../params.js";
import {
  dockerListNetworks,
  dockerCreateNetwork,
  dockerNetworkConnect
} from "../../docker/index.js";
import { listPackageNoThrow } from "../../docker/list/index.js";
import { isRunningHttps } from "./isRunningHttps.js";

/**
 * Connect to dnpublic_network with an alias if:
 * - is HTTPS package
 * - any package with https portal mappings
 */
export async function connectToPublicNetwork(
  pkg: InstallPackageData,
  externalNetworkName: string
): Promise<void> {
  // if there is no https, checks aren't needed
  if (!(await isRunningHttps())) return;

  // create network if necessary
  const networks = await dockerListNetworks();
  if (!networks.find(network => network.Name === externalNetworkName))
    await dockerCreateNetwork(externalNetworkName);

  const containers =
    (
      await listPackageNoThrow({
        dnpName: pkg.dnpName
      })
    )?.containers || [];

  if (containers.length === 0) return;

  for (const container of containers) {
    if (
      pkg.dnpName === params.HTTPS_PORTAL_DNPNAME ||
      (await httpsPortal.hasMapping(pkg.dnpName, container.serviceName))
    ) {
      const alias = getExternalNetworkAlias({
        serviceName: container.serviceName,
        dnpName: pkg.dnpName
      });

      if (!container.networks.find(n => n.name === externalNetworkName)) {
        await dockerNetworkConnect(
          externalNetworkName,
          container.containerName,
          { Aliases: [alias] }
        );
      }
    }
  }
}
