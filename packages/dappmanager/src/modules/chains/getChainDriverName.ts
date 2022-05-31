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

const knownChains: { [dnpName: string]: ChainDriver } = {

  "openethereum.dnp.dappnode.eth": "ethereum",
  "ropsten.dnp.dappnode.eth": "ethereum",
  "rinkeby.dnp.dappnode.eth": "ethereum",
  "kovan.dnp.dappnode.eth": "ethereum",
  "bitcoin.dnp.dappnode.eth": "bitcoin",
  "monero.dnp.dappnode.eth": "monero",
  "prysm.dnp.dappnode.eth": "ethereum-beacon-chain",
  "prysm-prater.dnp.dappnode.eth": "ethereum-beacon-chain",
  "lighthouse-prater.dnp.dappnode.eth": "ethereum-beacon-chain",
  "teku-prater.dnp.dappnode.eth": "ethereum-beacon-chain"
  
  // Pending: https://github.com/dappnode/DAppNodePackage-prysm/pull/65
  "prysm.dnp.dappnode.eth": "ethereum-beacon-chain"
  // ===============================
  // DO NOT ADD ANY NEW PACKAGE HERE
  // ===============================
  // Instead add "chain" property in your package, like https://github.com/dappnode/DAppNodePackage-prysm/pull/65
  // Full docs: https://docs.dappnode.io/developers/manifest-reference#chain

};
