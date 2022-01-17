// Import
import { importKeystoresAndSlashingProtectionViaApi } from "./import/importKeystoresAndSlashingProtectionViaApi";
// Export
import { exportKeystoresAndSlashingProtection } from "./export/exportKeystoresAndSlashingProtection";
import { cleanExportedKeystoresAndSlashingProtection } from "./export/cleanExportedKeystoresAndSlashingProtection";
import { readExportedKeystoresAndSlashingProtection } from "./export/readExportedKeystoresAndSlashingProtection";
// Requirements
import { ensureRequirements } from "./requirements";
// Rollback
import { rollbackToPrysmOld } from "./rollbackToPrysmOld";
// Other
import { extendError } from "../../utils/extendError";
import shell from "../../utils/shell";
import { dockerVolumeRemove } from "../docker";
// Params
import params from "../../params";
import { Eth2Client, Eth2Network } from "./params";
// Utils
import getDappmanagerImage from "../../utils/getDappmanagerImage";
import { getMigrationParams, getPrysmOldValidatorImage } from "./utils";

export async function eth2Migrate({
  client,
  network
}: {
  client: Eth2Client;
  network: Eth2Network;
}): Promise<void> {
  // TODO: determine the prysm-web3signer version
  const prysmWeb3signerVersion = "2.0.0";

  // Get params deppending on the network
  const {
    newEth2ClientDnpName,
    prysmOldDnpName,
    prysmOldValidatorContainerName,
    prysmOldValidatorVolumeName,
    prysmOldStableVersion,
    signerDnpName,
    signerContainerName
  } = getMigrationParams(client, network);

  // Get SOME image to run 'cp' or 'rm' commands on Prysm's volume
  const alpineImage = await getDappmanagerImage();

  const prysmOldValidatorImage = await getPrysmOldValidatorImage({
    prysmOldDnpName,
    prysmOldStableVersion
  });

  // Ensure requirements
  await ensureRequirements({
    signerDnpName,
    signerContainerName,
    newEth2ClientDnpName,
    client,
    prysmWeb3signerVersion,
    prysmOldValidatorContainerName
  });

  try {
    // Move wallet dir to a new location different to what the container expects
    await shell([
      "docker run",
      "--rm",
      `--name ${params.CONTAINER_TOOL_NAME_PREFIX}prysm-migration`,
      "--volume validator-data:/root/",
      alpineImage,
      "mv /root/.eth2validators /root/.eth2validators.backup"
    ]).catch(e => {
      throw extendError(e, "Error moving Prysm's legacy wallet directory");
    });

    // Backup keystores and slashing protection in docker volume
    await exportKeystoresAndSlashingProtection({
      network,
      prysmOldValidatorImage,
      prysmOldValidatorVolumeName,
      prysmOldWalletDirRelativePath: ".eth2validators.backup",
      alpineImage
    });

    // Import validator: keystores and slashing protection from docker volume to web3signer
    const exportedData = readExportedKeystoresAndSlashingProtection();
    await importKeystoresAndSlashingProtectionViaApi({
      signerDnpName,
      ...exportedData
    });
  } catch (e) {
    cleanExportedKeystoresAndSlashingProtection();
    await rollbackToPrysmOld();

    throw extendError(e, "Eth2 migration failed");
  }

  // Clean up DAPPMANAGER temp files
  cleanExportedKeystoresAndSlashingProtection();

  if (client === "prysm") {
    // If Prysm: Only delete keys, don't delete volume
    // MUST confirm that keys are alive in Web3Signer
    // - Delete keys from Prysm's legacy container
    await shell([
      "docker run",
      "--rm",
      `--name ${params.CONTAINER_TOOL_NAME_PREFIX}prysm-migration`,
      `--volume ${prysmOldValidatorVolumeName}:/root/`,
      alpineImage,
      "rm -rf /root/.eth2validators.backup"
    ]).catch(e => {
      throw extendError(e, "Error moving Prysm's legacy wallet directory");
    });
  } else {
    // If NOT Prysm: Delete volume
    await dockerVolumeRemove(prysmOldValidatorVolumeName);
  }
}
