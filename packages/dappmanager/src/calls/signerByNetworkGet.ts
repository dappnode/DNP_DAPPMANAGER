import { listPackageNoThrow } from "@dappnode/dockerapi";
import { Network, SignerStatus } from "@dappnode/types";

async function signerStatusGet({ network }: { network: Network }): Promise<SignerStatus> {
  const signerDnp = await listPackageNoThrow({
    dnpName: `web3signer${network !== Network.Mainnet ? `-${network}` : ""}.dnp.dappnode.eth`
  });

  const isInstalled = Boolean(signerDnp);

  const brainRunning = Boolean(
    signerDnp && signerDnp.containers.find((c) => c.serviceName.includes("brain"))?.state === "running"
  );

  return { isInstalled, brainRunning };
}

export async function signerByNetworkGet({
  networks
}: {
  networks: Network[];
}): Promise<Partial<Record<Network, SignerStatus>>> {
  const results: Partial<Record<Network, SignerStatus>> = {};

  for (const network of networks) {
    results[network] = await signerStatusGet({ network });
  }

  return results;
}
