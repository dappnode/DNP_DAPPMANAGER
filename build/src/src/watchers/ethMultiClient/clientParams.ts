import { EthClientTarget, UserSettings } from "../../types";
import params from "../../params";

export const publicRpcUrl = params.REMOTE_MAINNET_RPC_URL;

/**
 * Returns the url of the JSON RPC for each Ethereum client tag
 * @param target Ethereum client type
 */
export function getEthProviderUrl(target: EthClientTarget): string {
  switch (target) {
    case "remote":
      return publicRpcUrl;

    case "geth-light":
      return "http://geth-light.dappnode:8545";

    case "geth-fast":
      return "http://geth.dappnode:8545";

    case "parity":
      return "http://parity.dappnode:8545";

    default:
      throw Error(`Unknown client target: ${target}`);
  }
}

/**
 * Returns package data for each Ethereum client tag
 * @param target Ethereum client type
 */
export function getClientData(
  target: EthClientTarget
): { name: string; userSettings?: UserSettings } {
  switch (target) {
    case "remote":
      throw Error(`Client RPC does not require an install`);

    case "geth-light":
      return {
        name: "geth.dnp.dappnode.eth",
        userSettings: {
          environment: {
            EXTRA_OPTS: "--rpcapi eth,net,web3,txpool --syncmode light"
          }
        }
      };

    case "geth-fast":
      return { name: "geth.dnp.dappnode.eth" };

    case "parity":
      return { name: "parity.dnp.dappnode.eth" };

    default:
      throw Error(`Unsupported client target: ${target}`);
  }
}
