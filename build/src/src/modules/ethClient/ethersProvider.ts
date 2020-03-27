import { ethers } from "ethers";
import * as db from "../../db";
import params from "../../params";
import { getClientData } from "./clientParams";
import { EthClientTarget } from "../../types";
import { listContainerNoThrow } from "../../modules/docker/listContainers";
import { getTarget, getStatus, getFallback } from "./utils";

export type ProviderGetter = () => Promise<ethers.providers.Provider>;

export class EthersProvider {
  provider: ethers.providers.Provider | undefined = undefined;

  async getProvider(): Promise<ethers.providers.Provider> {
    if (!this.provider) this.provider = await getEthersProvider();
    return this.provider;
  }
}

/**
 * Returns the url of the JSON RPC an Eth multi-client status and target
 * If the package target is not active it returns the remote URL
 * @return initialized ethers instance
 */
export async function getEthersProvider(): Promise<
  ethers.providers.JsonRpcProvider
> {
  const url = await getEthProviderUrl();
  // Store (just for UI / info purposes) the latest used url
  db.ethProviderUrl.set(url);
  return new ethers.providers.JsonRpcProvider(url);
}

/**
 * Returns the url of the JSON RPC an Eth multi-client status and target
 * If the package target is not active it returns the remote URLs
 * @return ethProvier http://geth.dappnode:8545
 */
async function getEthProviderUrl(): Promise<string> {
  const target = getTarget();
  const status = getStatus();
  const fallback = getFallback();

  if (!target || target === "remote") {
    // Remote is selected, just return remote
    return params.REMOTE_MAINNET_RPC_URL;
  } else {
    try {
      if (status === "active") {
        // Client is active, test and return
        await assertTargetIsAvailable(target);
        return getClientData(target).url;
      } else {
        // Client not active, no need to check
        throw Error(`is ${status}`);
      }
    } catch (e) {
      if (fallback === "on") {
        // Fallback on, ignore error and return remote
        return params.REMOTE_MAINNET_RPC_URL;
      } else {
        // Fallback off, throw nice error
        throw Error(`Ethereum client not available: ${e.message}`);
      }
    }
  }
}

// Call to dappmanager.dnp.dappnode.eth, getByVersionId(35)
// Returns (uint16[3] semanticVersion, address contractAddress, bytes contentURI)
const testTxData = {
  to: "0x0c564ca7b948008fb324268d8baedaeb1bd47bce",
  data:
    "0x737e7d4f0000000000000000000000000000000000000000000000000000000000000023"
};
const result =
  "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000342f697066732f516d63516958454c42745363646278464357454a517a69664d54736b4e5870574a7a7a5556776d754e336d4d4361000000000000000000000000";

/**
 * Returns void if a given ethers provider is okay to fetch APM state
 * Otherwise returns an error with the guessed caused of problems
 * @param provider
 */
async function assertTargetIsAvailable(target: EthClientTarget): Promise<void> {
  const { url, name } = getClientData(target);
  const provider = new ethers.providers.JsonRpcProvider(url);
  try {
    const res = await provider.send("eth_call", [testTxData, "latest"]);
    if (res !== result) {
      const syncing = await provider.send("eth_syncing", []);
      if (syncing) {
        throw Error(`is syncing`);
      } else {
        throw Error(`test state called failed`);
      }
    }
  } catch (e) {
    if (e.message.includes("ECONNREFUSED")) {
      const dnp = await listContainerNoThrow(name);
      if (!dnp) throw Error(`not installed`);
      if (!dnp.running) throw Error(`not running`);
    }
    throw e;
  }
}
