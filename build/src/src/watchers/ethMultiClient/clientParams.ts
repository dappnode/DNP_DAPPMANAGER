import { EthClientTarget, UserSettings } from "../../types";

/**
 * Returns package data for each Ethereum client tag
 * @param target Ethereum client type
 */
export function getClientData(
  target: EthClientTarget
): { name: string; url: string; userSettings?: UserSettings } {
  switch (target) {
    case "remote":
      throw Error(`No client data for remote target`);

    case "geth-light":
      return {
        name: "geth.dnp.dappnode.eth",
        url: "http://geth.dappnode:8545",
        userSettings: {
          environment: {
            EXTRA_OPTS: "--rpcapi eth,net,web3,txpool --syncmode light"
          }
        }
      };

    case "geth":
      return {
        name: "geth.dnp.dappnode.eth",
        url: "http://geth.dappnode:8545"
      };

    case "open-ethereum":
      return {
        name: "open-ethereum.dnp.dappnode.eth",
        url: "http://open-ethereum.dappnode:8545"
      };

    default:
      throw Error(`Unsupported client target: ${target}`);
  }
}
