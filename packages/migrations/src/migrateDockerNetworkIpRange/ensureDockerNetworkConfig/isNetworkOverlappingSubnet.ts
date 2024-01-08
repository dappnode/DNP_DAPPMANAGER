import Dockerode from "dockerode";
import { subnetsOverlap } from "./subnetsOverlap.js";

/**
 * Checks if a given subnet overlaps with any of the subnets in a Docker network.
 * @param network - Docker network information as provided by Dockerode.
 * @param subnet - A string representing the subnet in CIDR notation to check for overlap.
 * @returns True if there is an overlap with any of the network's subnets, false otherwise.
 */
export function isNetworkOverlappingSubnet(
  network: Dockerode.NetworkInspectInfo,
  subnet: string
): boolean {
  const networkSubnets =
    network.IPAM?.Config?.map((config) => config.Subnet) ?? [];

  return networkSubnets.some(
    (networkSubnet) => networkSubnet && subnetsOverlap(networkSubnet, subnet)
  );
}
