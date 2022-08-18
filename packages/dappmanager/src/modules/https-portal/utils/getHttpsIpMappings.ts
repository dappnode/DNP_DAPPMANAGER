import { httpsPortal } from "../../../calls";
import params from "../../../params";
import { PackageContainer } from "../../../types";
import { dockerContainerInspect } from "../../docker";
import { isRunningHttps } from "./isRunningHttps";

/**
 * Returns an array of tuples with the format
 * [ [httpsMapping, httpsContainer.ip], ... ]
 */
export async function getHttpsIpMappings(
  containersToUpdate: PackageContainer[]
): Promise<[string, string][]> {
  if (await isRunningHttps()) {
    // Get the HTTPS container IP
    const httpsNetworkSettings = (
      await dockerContainerInspect(params.httpsContainerName)
    ).NetworkSettings.Networks[params.DNP_PRIVATE_NETWORK_NAME];
    if (!httpsNetworkSettings)
      throw Error(`No network settings for ${params.httpsContainerName}`);
    const httpsIp = httpsNetworkSettings.IPAddress;
    if (!httpsIp) throw Error(`No IP for ${params.httpsContainerName}`);

    // Get the HTTPS mappings fo the containersToUpdate
    const mappings = await httpsPortal.getMappings(containersToUpdate);
    if (!mappings) return [];

    return mappings.map(mapping => [mapping.fromSubdomain, httpsIp]);
  }
  return [];
}
