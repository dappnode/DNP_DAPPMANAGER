import Web3 from "web3";
import params from "../../params";
import { fetchApmVersionsMetadata } from "./fetchApmVersionsMetadata";
import { fetchApmVersionsState } from "./fetchApmVersionsState";
import { fetchVersion } from "./fetchVersion";
import { repoExists } from "./repoExists";
import { ApmVersionState, ApmVersionMetadata, ApmVersionRaw } from "./types";

export class Apm {
  async getProvider(): Promise<Web3> {
    const web3 = new Web3(params.ETH_MAINNET_RPC_URL_REMOTE);
    return web3;
  }

  /**
   * Fetch a specific version of an APM repo
   * If version is falsy, gets the latest version
   * @param dnpName "bitcoin.dnp.dappnode.eth"
   * @param version "0.2.4"
   */
  async fetchVersion(
    dnpName: string,
    version?: string
  ): Promise<ApmVersionRaw> {
    return fetchVersion(await this.getProvider(), dnpName, version);
  }

  /**
   * Fetch all versions of an APM repo
   * If provided version request range, only returns satisfying versions
   * @param dnpName "bitcoin.dnp.dappnode.eth"
   */
  async fetchApmVersionsState(
    dnpName: string,
    lastVersionId?: number
  ): Promise<ApmVersionState[]> {
    return fetchApmVersionsState(
      await this.getProvider(),
      dnpName,
      lastVersionId
    );
  }

  /**
   * Fetches the new repos logs from a registry
   * @param dnpName "bitcoin.dnp.dappnode.eth"
   */
  async fetchApmVersionsMetadata(
    dnpName: string,
    fromBlock?: number
  ): Promise<ApmVersionMetadata[]> {
    return fetchApmVersionsMetadata(
      await this.getProvider(),
      dnpName,
      fromBlock
    );
  }

  /**
   * Returns true if an APM repo exists for a package dnpName
   * @param dnpName "bitcoin.dnp.dappnode.eth"
   */
  async repoExists(dnpName: string): Promise<boolean> {
    return repoExists(await this.getProvider(), dnpName);
  }
}
