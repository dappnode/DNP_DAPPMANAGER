import { EthersProvider } from "../ethClient";
import { fetchApmVersionsMetadata } from "./fetchApmVersionsMetadata";
import { fetchApmVersionsState } from "./fetchApmVersionsState";
import { fetchVersion } from "./fetchVersion";

export class Apm extends EthersProvider {
  /**
   * Fetch a specific version of an APM repo
   * If version is falsy, gets the latest version
   * @param name "bitcoin.dnp.dappnode.eth"
   * @param version "0.2.4"
   */
  async fetchVersion(name: string, version?: string) {
    return fetchVersion(await this.getProvider(), name, version);
  }

  /**
   * Fetch all versions of an APM repo
   * If provided version request range, only returns satisfying versions
   * @param name "bitcoin.dnp.dappnode.eth"
   */
  async fetchApmVersionsState(name: string, lastVersionId?: number) {
    return fetchApmVersionsState(await this.getProvider(), name, lastVersionId);
  }

  /**
   * Fetches the new repos logs from a registry
   * @param name "bitcoin.dnp.dappnode.eth"
   */
  async fetchApmVersionsMetadata(name: string, fromBlock?: number) {
    return fetchApmVersionsMetadata(await this.getProvider(), name, fromBlock);
  }
}
