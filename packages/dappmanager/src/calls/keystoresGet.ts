import { listPackageNoThrow } from "@dappnode/dockerapi";
import { Network } from "@dappnode/types";

export async function keystoresGetByNetwork({
  networks
}: {
  networks: Network[];
}): Promise<Partial<Record<Network, Record<string, string[]> | null>>> {
  const result: Partial<Record<Network, Record<string, string[]> | null>> = {};

  for (const network of networks) {
    const signerDnpName =
      network === Network.Mainnet ? "web3signer.dnp.dappnode.eth" : `web3signer-${network}.dnp.dappnode.eth`;
    const signerDnp = await listPackageNoThrow({ dnpName: signerDnpName });
    const isInstalled = Boolean(signerDnp);

    if (isInstalled) {
      try {
        const response = await fetch(
          `http://brain.web3signer${
            network === Network.Mainnet ? "" : `-${network}`
          }.dappnode:5000/api/v0/brain/validators?format=pubkey`,
          {
            method: "GET",
            headers: {
              Accept: "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        result[network] = data ? data : undefined;
      } catch (error) {
        console.error("Error fetching keystores:", error);
      }
    }
  }

  return result;
}
