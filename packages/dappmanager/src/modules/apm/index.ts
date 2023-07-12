import { ethers } from "ethers";
import { getEthersProvider } from "../ethClient/index.js";
import { fetchApmVersionsMetadata } from "./fetchApmVersionsMetadata.js";
import { fetchApmVersionsState } from "./fetchApmVersionsState.js";
import { fetchVersion } from "./fetchVersion.js";
import { repoExists } from "./repoExists.js";
import { ApmVersionState, ApmVersionMetadata, ApmVersionRaw } from "./types.js";

export class Apm {
  provider: ethers.providers.Provider | undefined = undefined;

  async getProvider(): Promise<ethers.providers.Provider> {
    if (!this.provider) this.provider = await getEthersProvider();
    return this.provider;
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
