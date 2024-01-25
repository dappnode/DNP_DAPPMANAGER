/**
 * Removes the CIDR suffix from an IP address. This function is useful for processing
 * the output of `docker.getNetwork().inspect().Containers` information, where the IP
 * address includes the CIDR suffix.
 *
 * @param ipWithCidr The IP address with CIDR suffix (e.g., '172.30.0.7/16').
 * @returns The IP address without the CIDR suffix (e.g., '172.30.0.7').
 */
export function removeCidrSuffix(ipWithCidr: string): string {
  return ipWithCidr.split("/")[0];
}
