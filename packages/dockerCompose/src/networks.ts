import { ComposeServiceNetworks, ComposeServiceNetworksObj } from "@dappnode/types";

/**
 * Parse service networks to object form
 * @param networks
 */
export function parseServiceNetworks(networks: ComposeServiceNetworks): ComposeServiceNetworksObj {
  if (Array.isArray(networks)) {
    const networksObj: ComposeServiceNetworksObj = {};
    for (const networkName of networks) {
      if (typeof networkName === "string") networksObj[networkName] = {};
    }
    return networksObj;
  } else {
    return networks;
  }
}
