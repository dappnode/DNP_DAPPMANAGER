import { dockerContainerRemove } from "../../docker";
import { Eth2Client } from "../params";
import { ensureEth2ClientIsInstalledAndSynced } from "./ensureEth2ClientIsInstalledAndSynced";
import { ensureOldPrysmValidatorContainerIsRemoved } from "./ensureOldPrysmValidatorContainerIsRemoved";
import { ensureWeb3SignerIsInstalledAndStopped } from "./ensureWeb3SignerIsInstalledAndStopped";

/**
 * Ensures:
 * - web3signer installed and stopped
 * - eth2client installed and synced
 * - old prysm validator container removed
 */
export async function ensureRequirements({
  signerDnpName,
  signerContainerName,
  newEth2ClientDnpName,
  client,
  newEth2ClientVersion,
  prysmOldValidatorContainerName
}: {
  signerDnpName: string;
  signerContainerName: string;
  newEth2ClientDnpName: string;
  client: Eth2Client;
  newEth2ClientVersion: string;
  prysmOldValidatorContainerName: string;
}): Promise<void> {
  await ensureWeb3SignerIsInstalledAndStopped({
    signerDnpName,
    signerContainerName
  });

  // Ensure new Eth2 client is installed and synced
  await ensureEth2ClientIsInstalledAndSynced({
    dnpName: newEth2ClientDnpName,
    client,
    newEth2ClientVersion
  });

  // - If to Prysm: The update will have deleted the old container
  // - If NOT to Prysm: Delete validator container
  if (client === "prysm") {
    await ensureOldPrysmValidatorContainerIsRemoved({
      prysmOldValidatorContainerName,
      newEth2ClientVersion
    });
  } else {
    await dockerContainerRemove(prysmOldValidatorContainerName);
  }
}
