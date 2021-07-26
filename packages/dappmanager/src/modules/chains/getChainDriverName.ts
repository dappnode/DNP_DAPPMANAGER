import { ChainDriver, InstalledPackageData } from "../../common";

/**
 * Get ChainDriver for a given dnp
 * Uses a hardcoded registry for new packages that have not updated their manifests yet
 */
export function getChainDriverName(
  dnp: InstalledPackageData
): ChainDriver | null {
  return (dnp.chain || knownChains[dnp.dnpName]) ?? null;
}

export const knownChains: { [dnpName: string]: ChainDriver } = {
  "openethereum.dnp.dappnode.eth": "ethereum",
  "ropsten.dnp.dappnode.eth": "ethereum",
  "rinkeby.dnp.dappnode.eth": "ethereum",
  "kovan.dnp.dappnode.eth": "ethereum",
  "bitcoin.dnp.dappnode.eth": "bitcoin",
  "monero.dnp.dappnode.eth": "monero",
  "prysm.dnp.dappnode.eth": "ethereum2-beacon-chain-prysm",
  "prysm-pyrmont.dnp.dappnode.eth": "ethereum2-beacon-chain-prysm",
  "prysm-prater.dnp.dappnode.eth": "ethereum2-beacon-chain-prysm"
};
