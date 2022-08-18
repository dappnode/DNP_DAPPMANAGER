import { httpsPortal } from "../../../calls";
import params from "../../../params";
import { PackageContainer } from "../../../types";
import { dockerContainerInspect } from "../../docker";
import { isRunningHttps } from "./isRunningHttps";
import * as db from "../../../db";

/**
 * Returns an array of tuples with the format
 * @returns [ [goerli-geth.f6e36f19e349b0dd.dyndns.dappnode.io, 172.33.15.0], ... ]
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

    // Get the dyndns identity
    const dyndnsIdentity = db.dyndnsIdentity.get();
    if (!dyndnsIdentity) throw Error(`No dyndns identity available`);

    // Get the HTTPS mappings fo the containersToUpdate
    const mappings = await httpsPortal.getMappings(containersToUpdate);
    if (!mappings) return [];

    return mappings.map(mapping => [
      `${mapping.fromSubdomain}.${dyndnsIdentity}`,
      httpsIp
    ]);
  }
  return [];
}
