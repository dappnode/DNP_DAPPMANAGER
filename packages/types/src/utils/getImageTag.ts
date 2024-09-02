import { getContainerDomain } from "./getContainerDomain.js";

/**
 * Returns the image tag for the given DAppNode package name, service name and version
 * @param dnpName DAppNode package name
 * @param serviceName Service name
 * @param version Container version
 * @returns Image tag in the format <container-domain>:<version>, where container-domain is the domain obtained with getContainerDomain
 * @throws Error if version is not provided
 * @throws Error if DAppNode package name is not provided
 * @throws Error if service name is not provided
 */
export const getImageTag = ({
  dnpName,
  serviceName,
  version
}: {
  dnpName: string;
  serviceName: string;
  version: string;
}): string => {
  if (!version) throw new Error("Version is required");
  if (!dnpName) throw new Error("DAppNode package name is required");
  if (!serviceName) throw new Error("Service name is required");
  return [getContainerDomain({ dnpName, serviceName }), version].join(":");
};
