import { listPackageNoThrow } from "../docker/list/listPackages";
import { httpsPortal } from "../../calls/httpsPortal";
import { prettyDnpName } from "../../utils/format";
import params from "../../params";
import { InstallPackageData } from "../../types";
import { Log } from "../../utils/logUi";
import { HttpsPortalMapping } from "../../common";
import { getExternalNetworkAliasFromPackage } from "../../domains";
import { ComposeFileEditor } from "../compose/editor";
import { dockerListNetworks, dockerCreateNetwork } from "../docker";

/**
 * Recreate HTTPs portal mapping if installing or updating HTTPs package
 */
export async function httpsEnsureNetworkExists(
  pkg: InstallPackageData,
  externalNetworkName: string
): Promise<void> {
  const networks = await dockerListNetworks();
  if (!networks.find(network => network.Name === externalNetworkName)) {
    await dockerCreateNetwork(externalNetworkName);
  }

  // Check whether DNP_HTTPS compose has external network persisted
  const compose = new ComposeFileEditor(pkg.dnpName, true);
  if (compose.getComposeNetwork(externalNetworkName) === null) {
    const composeService = compose.firstService();
    const alias = getExternalNetworkAliasFromPackage(
      pkg.dnpName,
      composeService.serviceName
    );
    const aliases = [alias];
    composeService.addNetwork(externalNetworkName, { aliases });
    compose.write();
  }
}

/**
 * Persist external network on packages compose files
 */
export async function httpsPersistPackagesExternalNetwork(
  pkg: InstallPackageData,
  externalNetworkName: string
): Promise<void> {
  const compose = new ComposeFileEditor(pkg.dnpName, pkg.isCore);
  const services = Object.entries(compose.services());

  for (const [serviceName, composeServiceEditor] of services) {
    if (await httpsPortal.hasMapping(pkg.dnpName, serviceName)) {
      const networks = await dockerListNetworks();
      if (!networks.find(network => network.Name === externalNetworkName)) {
        await dockerCreateNetwork(externalNetworkName);
      }

      const alias = getExternalNetworkAliasFromPackage(
        pkg.dnpName,
        serviceName
      );
      const aliases = [alias];
      composeServiceEditor.addNetwork(externalNetworkName, { aliases });
      compose.write();
      break;
    }
  }
}

/**
 * Expose default HTTPS ports on installation defined in the manifest - exposable
 */
export async function httpsExposeByDefaultPorts(
  pkg: InstallPackageData,
  log: Log
): Promise<void> {
  if (pkg.metadata.exposable) {
    // Check HTTPS package exists
    const httpsPackage = await listPackageNoThrow({
      dnpName: params.HTTPS_PORTAL_DNPNAME
    });
    if (!httpsPackage)
      throw Error(
        `HTTPS package not found but required to expose HTTPS ports by default. Install HTTPS package first.`
      );
    // Check HTTPS package running
    httpsPackage.containers.map(container => {
      if (!container.running)
        throw Error(
          `HTTPS package not running but required to expose HTTPS ports by default.`
        );
    });
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
