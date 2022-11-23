import Web3 from "web3";

/**
 * Returns true if an APM repo exists for a package name
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 */
export async function repoExists(
  web3: Web3,
  dnpName: string
): Promise<boolean> {
  const address = await web3.eth.ens.getAddress(dnpName);

  return Boolean(address);
}
