import { Log } from "../../../utils/logUi";
import { httpsPortal } from "../../../calls";
import { InstallPackageData, HttpsPortalMapping } from "@dappnode/common";
import { prettyDnpName } from "../../../utils/format";
import { isRunningHttps } from "./isRunningHttps";

/**
 * Expose default HTTPS ports on installation defined in the manifest - exposable
 */
export async function exposeByDefaultHttpsPorts(
  pkg: InstallPackageData,
  log: Log
): Promise<void> {
  const exposables = pkg.metadata.exposable;

  // Return if no exposable or not exposeByDefault
  if (!exposables || !exposables.some(exp => exp.exposeByDefault)) return;

  // Requires that https package exists and it is running
  if (!(await isRunningHttps()))
    throw Error(
      `HTTPS package not running but required to expose HTTPS ports by default.`
    );

  const currentMappings = await httpsPortal.getMappings();
  const portMappinRollback: HttpsPortalMapping[] = [];

  for (const exposable of exposables) {
    if (exposable.exposeByDefault) {
      const portalMapping: HttpsPortalMapping = {
        fromSubdomain: exposable.fromSubdomain || prettyDnpName(pkg.dnpName), // get dnpName by default
        dnpName: pkg.dnpName,
        serviceName:
          exposable.serviceName || Object.keys(pkg.compose.services)[0], // get first service name by default (docs: https://docs.dappnode.io/es/developers/manifest-reference/#servicename)
        port: exposable.port
      };

      if (currentMappings.length > 0 && currentMappings.includes(portalMapping))
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
        if (e.message.includes("External endpoint already exists")) {
          // Bypass error if already exposed: 400 Bad Request {"error":"External endpoint already exists"}
          log(
            pkg.dnpName,
            `External endpoint already exists for ${prettyDnpName(
              pkg.dnpName
            )}:${exposable.port}`
          );
        } else {
          // Remove all mappings and throw error to trigger package install rollback
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
