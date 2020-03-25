import { ethers } from "ethers";
import { Dependencies } from "../../../types";
import resolveReleaseName from "../../release/resolveReleaseName";
import { fetchManifestOnly } from "../../release/getManifest";

export function fetchDependenciesSetup(provider: ethers.providers.Provider) {
  /**
   * Fetches the dependencies of a given DNP name and version
   * @returns dependencies:
   *   { dnp-name-1: "semverRange", dnp-name-2: "/ipfs/Qmf53..."}
   */
  return async function fetchDependenciesSetup(
    name: string,
    version: string
  ): Promise<Dependencies> {
    const { hash } = await resolveReleaseName(provider, name, version);
    const manifest = await fetchManifestOnly(hash);
    return manifest.dependencies || {};
  };
}
