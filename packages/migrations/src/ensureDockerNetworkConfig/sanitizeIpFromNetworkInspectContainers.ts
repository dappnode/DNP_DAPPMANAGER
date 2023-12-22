/**
 * Sanitizes an IP address by removing the subnet information. It MUST be used
 * for the output of docker.getNetwork().inspect().Containers info, where the ip
 * has the subnet injected.
 *
 * @param ipWithSubnet The IP address with subnet information (e.g., '172.30.0.7/16').
 * @returns The sanitized IP address without subnet (e.g., '172.30.0.7').
 */
export function sanitizeIpFromNetworkInspectContainers(ipWithSubnet: string) {
  return ipWithSubnet.split("/")[0];
}
