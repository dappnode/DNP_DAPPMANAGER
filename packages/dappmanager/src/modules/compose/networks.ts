import { ComposeServiceNetworks, ComposeServiceNetworksObj } from "../../types";

/**
 * Parse service networks as object form
 * @param networks
 */
export function parseServiceNetworks(
  networks: ComposeServiceNetworks
): ComposeServiceNetworksObj {
  if (Array.isArray(networks)) {
    return networks.reduce(
      (networksObj, networkName) => ({
        ...networksObj,
        [networkName]: {}
      }),
      {} as ComposeServiceNetworksObj
    );
  } else {
    return networks;
  }
}
