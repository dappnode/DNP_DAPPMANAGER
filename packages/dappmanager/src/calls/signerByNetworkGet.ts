import { listPackageNoThrow } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { Network, SignerStatus } from "@dappnode/types";

/** Timeout in milliseconds for each individual signer status request */
const SIGNER_TIMEOUT_MS = 5000;

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

/**
 * Wraps a signer status fetch with a timeout. If the request exceeds
 * SIGNER_TIMEOUT_MS, it returns a default "not installed" status instead of blocking.
 */
async function fetchSignerWithTimeout(network: Network): Promise<SignerStatus> {
  try {
    const result = await Promise.race([
      signerStatusGet({ network }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${SIGNER_TIMEOUT_MS}ms`)), SIGNER_TIMEOUT_MS)
      )
    ]);
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logs.error(`Error fetching signer status for ${network}: ${message}`);
    return { isInstalled: false, brainRunning: false };
  }
}

export async function signerByNetworkGet({
  networks
}: {
  networks: Network[];
}): Promise<Partial<Record<Network, SignerStatus>>> {
  const results: Partial<Record<Network, SignerStatus>> = {};

  await Promise.all(
    networks.map(async (network) => {
      results[network] = await fetchSignerWithTimeout(network);
    })
  );

  return results;
}
