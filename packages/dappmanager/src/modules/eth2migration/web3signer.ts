import { logs } from "../../logs";
import { packageInstall } from "../../calls";
import { extendError } from "../../utils/extendError";
import { dockerContainerStop } from "../docker";
import { listPackageNoThrow } from "../docker/list";

/**
 * - MAY install the web3signer package
 * - MUST resolve after the signer container is available and stopped
 */
export async function ensureWeb3SignerIsInstalledAndStopped({
  signerDnpName,
  signerContainerName
}: {
  signerDnpName: string;
  signerContainerName: string;
}): Promise<void> {
  let web3SignerDnp = await listPackageNoThrow({ dnpName: signerDnpName });
  if (!web3SignerDnp) {
    logs.info(
      "Eth2 migration: web3signer package not installed, installing it"
    );

    // TODO: Don't run the signer container
    await packageInstall({ name: signerDnpName }).catch(e => {
      throw extendError(e, "web3signer installation failled");
    });

    web3SignerDnp = await listPackageNoThrow({ dnpName: signerDnpName });
    if (!web3SignerDnp) {
      throw Error("Web3Signer not found after successful installation");
    }
  }

  const signerContainer = web3SignerDnp.containers.find(
    c => c.containerName === signerContainerName
  );
  if (!signerContainer) {
    throw Error(`Web3Signer container ${signerContainerName} not found`);
  }

  // TODO: Check if this throws if container is already stopped
  await dockerContainerStop(signerContainerName);
}
