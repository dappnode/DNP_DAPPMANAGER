// Import
import { importKeystoresAndSlashingProtectionViaApi } from "./import/importKeystoresAndSlashingProtectionViaApi";
// Export
import { exportKeystoresAndSlashingProtection } from "./export/exportKeystoresAndSlashingProtection";
import { cleanExportedKeystoresAndSlashingProtection } from "./export/cleanExportedKeystoresAndSlashingProtection";
import { readExportedKeystoresAndSlashingProtection } from "./export/readExportedKeystoresAndSlashingProtection";
// Requirements
import { ensureRequirements } from "./requirements";
// Rollback
import { rollbackToPrysmOld } from "./rollback/rollbackToPrysmOld";
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
import { logs } from "../../logs";

export async function eth2Migrate({
  client,
  network
}: {
  client: Eth2Client;
  network: Eth2Network;
}): Promise<void> {
  // TODO: determine the prysm-web3signer version
  const prysmWeb3signerVersion = "2.0.0";

  logs.info("[eth2migration] Starting migration");

  logs.info("[eth2migration] getting params");
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

  logs.info("[eth2migration] migration params: ", {
    newEth2ClientDnpName,
    prysmOldDnpName,
    prysmOldValidatorContainerName,
    prysmOldValidatorVolumeName,
    prysmOldStableVersion,
    signerDnpName,
    signerContainerName
  });

  logs.info("[eth2migration] getting dappmanager image");

  // Get SOME image to run 'cp' or 'rm' commands on Prysm's volume
  const alpineImage = await getDappmanagerImage();

  logs.info("[eth2migration] alpine image: ", alpineImage);

  logs.info("[eth2migration] getting old prysm validator image");

  const prysmOldValidatorImage = await getPrysmOldValidatorImage({
    prysmOldDnpName,
    prysmOldStableVersion
  });

  logs.info(
    "[eth2migration] old prysm validator image: ",
    prysmOldValidatorImage
  );

  logs.info("[eth2migration] ensuring requirements");

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
    logs.info("[eth2migration] moving wallet dir in docker volume");
    // Move wallet dir to a new location different to what the container expects
    await shell([
      "docker run",
      "--rm",
      `--name ${params.CONTAINER_TOOL_NAME_PREFIX}prysm-migration`,
      `--volume ${prysmOldValidatorVolumeName}:/root`,
      alpineImage,
      "mv /root/.eth2validators /root/.eth2validators.backup"
    ]).catch(e => {
      throw extendError(e, "Error moving Prysm's legacy wallet directory");
    });

    logs.info("[eth2migration] export keystores and slashing protection");

    // Backup keystores and slashing protection in docker volume
    await exportKeystoresAndSlashingProtection({
      network,
      prysmOldValidatorImage,
      prysmOldValidatorVolumeName,
      prysmOldWalletDirRelativePath: ".eth2validators.backup",
      alpineImage
    });

    logs.info(
      "[eth2migration] importing keystores and slashing protection data"
    );

    // Import validator: keystores and slashing protection from docker volume to web3signer
    const exportedData = readExportedKeystoresAndSlashingProtection();
    await importKeystoresAndSlashingProtectionViaApi({
      signerContainerName,
      ...exportedData
    });
  } catch (e) {
    logs.info("[eth2migration] error exporting, cleaning and rolling back");
    cleanExportedKeystoresAndSlashingProtection();
    await rollbackToPrysmOld({
      signerDnpName,
      alpineImage,
      prysmOldValidatorVolumeName,
      prysmOldStableVersion,
      prysmOldDnpName
    });

    throw extendError(e, "Eth2 migration failed");
  }

  logs.info(
    "[eth2migration] cleaning exported keystores and slashing protection"
  );

  // Clean up DAPPMANAGER temp files
  cleanExportedKeystoresAndSlashingProtection();

  if (client === "prysm") {
    logs.info("[eth2migration] removing backup from prysm docker volume");
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
    logs.info("[eth2migration] removing prysm old docker volume");
    // If NOT Prysm: Delete volume
    await dockerVolumeRemove(prysmOldValidatorVolumeName);
  }
}
