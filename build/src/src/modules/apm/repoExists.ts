import { ethers } from "ethers";

/**
 * Returns true if an APM repo exists for a package name
 * @param name "bitcoin.dnp.dappnode.eth"
 */
export async function repoExists(
  provider: ethers.providers.Provider,
  name: string
): Promise<boolean> {
  const address = await provider.resolveName(name);

  return Boolean(address);
}
