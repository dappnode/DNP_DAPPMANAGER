import { InstalledPackageData } from "@dappnode/common";
import { ChainDriver } from "@dappnode/dappnodesdk";

/**
 * Get ChainDriver for a given dnp
 * Uses a hardcoded registry for new packages that have not updated their manifests yet
 */
export function getChainDriverName(
  dnp: InstalledPackageData
): ChainDriver | null {
  return (dnp.chain || knownChains[dnp.dnpName]) ?? null;
}

const knownChains: { [dnpName: string]: ChainDriver } = {
  // Pending: https://github.com/dappnode/DAppNodePackage-prysm/pull/65
  "prysm.dnp.dappnode.eth": "ethereum-beacon-chain"
  // ===============================
  // DO NOT ADD ANY NEW PACKAGE HERE
  // ===============================
  // Instead add "chain" property in your package, like https://github.com/dappnode/DAppNodePackage-prysm/pull/65
  // Full docs: https://docs.dappnode.io/developers/manifest-reference#chain
};
