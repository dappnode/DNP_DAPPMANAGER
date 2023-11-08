import { ethers } from "ethers";

/**
 * Returns true if an APM repo exists for a package name
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 */
export async function repoExists(
  provider: ethers.providers.Provider,
  dnpName: string
): Promise<boolean> {
  const address = await provider.resolveName(dnpName);

  return Boolean(address);
}
