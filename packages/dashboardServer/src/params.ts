import { Network } from "@dappnode/types";

/**
 * Supported networks for the dashboard server feature.
 * Per spec: must support both mainnet and hoodi.
 */
export const supportedNetworks: Network[] = [Network.Mainnet, Network.Hoodi];

/**
 * Get the brain web3signer URL for a given network
 */
export function getBrainUrl(network: Network): string {
  const networkSuffix = network === Network.Mainnet ? "" : `-${network}`;
  return `http://brain.web3signer${networkSuffix}.dappnode:5000`;
}

/**
 * Get the web3signer DnpName for a given network
 */
export function getWeb3signerDnpName(network: Network): string {
  return network === Network.Mainnet
    ? "web3signer.dnp.dappnode.eth"
    : `web3signer-${network}.dnp.dappnode.eth`;
}
