import { EthClientTarget } from "../../types";

export const nodeRpcUrl = "http://fullnode.dappnode:8545";
export const publicRpcUrl = "https://mainnet.dappnode.io:8545";

export function getEthProviderUrl(target: EthClientTarget): string {
  switch (target) {
    case "rpc":
      return publicRpcUrl;

    case "light-client":
    case "fullnode":
    default:
      return nodeRpcUrl;
  }
}

/**
 * Returns package data for each Ethereum client tag
 * @param target Ethereum client type
 */
export function getClientData(target: EthClientTarget): { name: string } {
  switch (target) {
    case "rpc":
      throw Error(`Client RPC does not require an install`);

    case "light-client":
      return { name: "geth-light.dnp.dappnode.eth" };

    case "fullnode":
      return { name: "geth.dnp.dappnode.eth" };

    default:
      throw Error(`Unknown client target: ${target}`);
  }
}
