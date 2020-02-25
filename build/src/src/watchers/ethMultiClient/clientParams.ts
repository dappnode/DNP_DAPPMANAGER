import { EthClientTarget, UserSettings } from "../../types";

export const nodeAlias = "fullnode";
export const nodeRpcUrl = `http://${nodeAlias}.dappnode:8545`;
export const publicRpcUrl = "https://mainnet.dappnode.io:8545";
export const genericUserSettings: UserSettings = {
  domainAlias: [nodeAlias]
};

export function getEthProviderUrl(target: EthClientTarget): string {
  switch (target) {
    case "remote":
      return publicRpcUrl;

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
    case "remote":
      throw Error(`Client RPC does not require an install`);

    case "geth-light":
      return { name: "geth-light.dnp.dappnode.eth" };

    case "geth-fast":
      return { name: "geth.dnp.dappnode.eth" };

    case "geth-full":
      return { name: "geth.dnp.dappnode.eth" };

    case "parity":
      return { name: "parity.dnp.dappnode.eth" };

    default:
      throw Error(`Unknown client target: ${target}`);
  }
}
