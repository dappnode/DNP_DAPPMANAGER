import { dockerContainerRemove } from "../../docker";
import { Eth2Client } from "../params";
import { ensureEth2ClientIsInstalledAndSynced } from "./ensureEth2ClientIsInstalledAndSynced";
import { ensureOldPrysmValidatorContainerIsRemoved } from "./ensureOldPrysmValidatorContainerIsRemoved";
import { ensureWeb3SignerIsInstalledAndStopped } from "./ensureWeb3SignerIsInstalledAndStopped";

export async function ensureRequirements({
  signerDnpName,
  signerContainerName,
  newEth2ClientDnpName,
  client,
  prysmWeb3signerVersion,
  prysmOldValidatorContainerName
}: {
  signerDnpName: string;
  signerContainerName: string;
  newEth2ClientDnpName: string;
  client: Eth2Client;
  prysmWeb3signerVersion: string;
  prysmOldValidatorContainerName: string;
}): Promise<void> {
  await ensureWeb3SignerIsInstalledAndStopped({
    signerDnpName,
    signerContainerName
  });

  // Ensure new Eth2 client is installed
  // TODO: Should it be done before hand?
  await ensureEth2ClientIsInstalledAndSynced({
    dnpName: newEth2ClientDnpName,
    client,
    prysmWeb3signerVersion
  });

  // - If to Prysm: The update will have deleted the old container
  // - If NOT to Prysm: Delete validator container
  if (client === "prysm") {
    await ensureOldPrysmValidatorContainerIsRemoved({
      prysmOldValidatorContainerName,
      prysmWeb3signerVersion
    });
  } else {
    await dockerContainerRemove(prysmOldValidatorContainerName);
  }
}
