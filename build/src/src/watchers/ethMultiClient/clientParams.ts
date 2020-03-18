import { EthClientTarget, UserSettings } from "../../types";

/**
 * Returns package data for each Ethereum client tag
 * @param target Ethereum client type
 */
export function getClientData(
  target: EthClientTarget
): {
  name: string;
  url: string;
  version?: string;
  userSettings?: UserSettings;
} {
  switch (target) {
    case "remote":
      throw Error(`No client data for remote target`);

    case "geth-light":
      return {
        name: "geth.dnp.dappnode.eth",
        url: "http://geth.dappnode:8545",
        userSettings: {
          environment: {
            SYNCMODE: "light"
          }
        }
      };

    case "geth":
      return {
        name: "geth.dnp.dappnode.eth",
        url: "http://geth.dappnode:8545"
      };

    case "openethereum":
      return {
        name: "openethereum.dnp.dappnode.eth",
        // #### TODO: Temp version for development / testing
        version: "QmbHRZTW9ubWUGp41wbCVnVXaUoUmyM9Tv689EvLbRTQCK",
        url: "http://openethereum.dappnode:8545"
      };

    default:
      throw Error(`Unsupported client target: ${target}`);
  }
}
