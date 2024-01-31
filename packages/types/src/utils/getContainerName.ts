import { getContainerDomain } from "./getContainerDomain.js";

/**
 * Returns the container name for the given DAppNode package name, service name and isCore flag
 * @param dnpName DAppNode package name
 * @param serviceName Service name
 * @param isCore Flag indicating whether the container is a core container or not
 * @returns Container name in the format <container-prefix>-<container-domain>, where container-prefix is the core or non-core prefix obtained from containerCoreNamePrefix and containerNamePrefix, respectively, and container-domain is the domain obtained with getContainerDomain
 */
export const getContainerName = ({
  dnpName,
  serviceName,
  isCore,
}: {
  dnpName: string;
  serviceName: string;
  isCore: boolean;
}): string =>
  // Note: _PREFIX variables already end with the character "-"
  [
    isCore ? "DAppNodeCore-" : "DAppNodePackage-",
    getContainerDomain({ dnpName, serviceName }),
  ].join("");
