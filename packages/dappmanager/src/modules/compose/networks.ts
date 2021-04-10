import { ComposeServiceNetworks, ComposeServiceNetworksObj } from "../../types";

/**
 * Parse service networks to object form
 * @param networks
 */
export function parseServiceNetworks(
  networks: ComposeServiceNetworks
): ComposeServiceNetworksObj {
  if (Array.isArray(networks)) {
    const networksObj: ComposeServiceNetworksObj = {};
    for (const networkName of networks) networksObj[networkName] = {};
    return networksObj;
  } else {
    return networks;
  }
}
