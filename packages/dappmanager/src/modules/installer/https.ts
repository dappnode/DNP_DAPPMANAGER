import { listPackageNoThrow } from "../docker/list/listPackages";
import { httpsPortal } from "../../calls/httpsPortal";
import { prettyDnpName } from "../../utils/format";
import params from "../../params";
import { InstallPackageData } from "../../types";
import { Log } from "../../utils/logUi";
import { HttpsPortalMapping } from "../../common";
import { getExternalNetworkAlias } from "../../domains";
import {
  dockerListNetworks,
  dockerCreateNetwork,
  dockerNetworkConnect
} from "../docker";

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

/**
 * Expose default HTTPS ports on installation defined in the manifest - exposable
 */
export async function exposeByDefaultHttpsPorts(
  pkg: InstallPackageData,
  log: Log
): Promise<void> {
  if (pkg.metadata.exposable) {
    // Requires that https package exists and it is running
    if (!(await isRunningHttps()))
      throw Error(
        `HTTPS package not running but required to expose HTTPS ports by default.`
      );

    const currentMappings = await httpsPortal.getMappings();
    const portMappinRollback: HttpsPortalMapping[] = [];

    for (const exposable of pkg.metadata.exposable) {
      if (exposable.exposeByDefault) {
        const portalMapping: HttpsPortalMapping = {
          fromSubdomain: exposable.fromSubdomain || prettyDnpName(pkg.dnpName), // get dnpName by default
          dnpName: pkg.dnpName,
          serviceName:
            exposable.serviceName || Object.keys(pkg.compose.services)[0], // get first service name by default (docs: https://docs.dappnode.io/es/developers/manifest-reference/#servicename)
          port: exposable.port
        };

        if (
          currentMappings.length > 0 &&
          currentMappings.includes(portalMapping)
        )
          continue;

        try {
          // Expose default HTTPS ports
          log(
            pkg.dnpName,
            `Exposing ${prettyDnpName(pkg.dnpName)}:${
              exposable.port
            } to the external internet`
          );
          await httpsPortal.addMapping(portalMapping);
          portMappinRollback.push(portalMapping);

          log(
            pkg.dnpName,
            `Exposed ${prettyDnpName(pkg.dnpName)}:${
              exposable.port
            } to the external internet`
          );
        } catch (e) {
          e.message = `${e.message} Error exposing default HTTPS ports, removing mappings`;
          for (const mappingRollback of portMappinRollback) {
            await httpsPortal.removeMapping(mappingRollback).catch(e => {
              log(
                pkg.dnpName,
                `Error removing mapping ${JSON.stringify(mappingRollback)}, ${
                  e.message
                }`
              );
            });
          }
          throw e;
        }
      }
    }
  }
}

// Utils

/**
 * Returns true if HTTPS package installed and running, otherwise return false
 */
async function isRunningHttps() {
  const httpsPackage = await listPackageNoThrow({
    dnpName: params.HTTPS_PORTAL_DNPNAME
  });

  if (!httpsPackage) return false;

  // Check every HTTPS container is running
  httpsPackage.containers.forEach(container => {
    if (!container.running) return false;
  });

  return true;
}
