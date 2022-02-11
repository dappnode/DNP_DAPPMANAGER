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
import { dockerContainerStart, imagesList } from "../docker";
// Params
import params from "../../params";
// Utils
import getDappmanagerImage from "../../utils/getDappmanagerImage";
import {
  getMigrationParams,
  getPrysmOldValidatorImage,
  moveWalletDirOldPrysmVolume
} from "./utils";
import { logs } from "../../logs";
import { Eth2Client, Eth2Network } from "../../types";
import { packageRemove } from "../../calls";

export async function eth2Migrate({
  client,
  network
}: {
  client: Eth2Client;
  network: Eth2Network;
}): Promise<void> {
  try {
    logs.info("Starting migration");

    logs.debug("getting params");
    // Get params deppending on the network
    const {
      newEth2ClientDnpName,
      newEth2ClientVersion,
      prysmOldDnpName,
      prysmOldValidatorContainerName,
      prysmOldValidatorVolumeName,
      prysmOldStableVersion,
      signerDnpName,
      signerContainerName
    } = getMigrationParams(client, network);

    logs.debug("migration params: ", {
      newEth2ClientDnpName,
      prysmOldDnpName,
      prysmOldValidatorContainerName,
      prysmOldValidatorVolumeName,
      prysmOldStableVersion,
      signerDnpName,
      signerContainerName
    });

    logs.debug("getting dappmanager image");

    // Get SOME image to run 'cp' or 'rm' commands on Prysm's volume
    const alpineImage = await getDappmanagerImage();

    logs.debug("alpine image: ", alpineImage);

    logs.debug("getting old prysm validator image");

    const dockerImages = await imagesList();
    const prysmOldValidatorImage = getPrysmOldValidatorImage({
      dockerImages,
      prysmOldDnpName,
      prysmOldStableVersion
    });

    logs.debug("old prysm validator image: ", prysmOldValidatorImage);

    logs.debug("ensuring requirements");

    await ensureRequirements({
      signerDnpName,
      signerContainerName,
      newEth2ClientDnpName,
      client,
      newEth2ClientVersion,
      prysmOldValidatorContainerName
    });

    try {
      logs.debug("moving wallet dir in docker volume");

      // Move wallet dir to a new location different to what the container expects
      await moveWalletDirOldPrysmVolume({
        prysmOldValidatorVolumeName,
        alpineImage,
        source: "/root/.eth2validators",
        target: "/root/.eth2validators.backup"
      });

      logs.debug("export keystores and slashing protection");

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

      logs.debug("exportedData: ", exportedData);

      logs.debug("Starting web3signer");

      await dockerContainerStart(signerContainerName);

      logs.debug("importing keystores and slashing protection data");

      await importKeystoresAndSlashingProtectionViaApi({
        signerContainerName,
        ...exportedData
      });
    } catch (e) {
      logs.error("error exporting, cleaning and rolling back", e);

      cleanExportedKeystoresAndSlashingProtection();
      // Move wallet dir back to the original location
      await moveWalletDirOldPrysmVolume({
        prysmOldValidatorVolumeName,
        alpineImage,
        source: "/root/.eth2validators.backup",
        target: "/root/.eth2validators"
      });
      await rollbackToPrysmOld({
        signerDnpName,
        alpineImage,
        prysmOldValidatorVolumeName,
        prysmOldStableVersion,
        prysmOldDnpName
      });

      throw extendError(e, "Eth2 migration failed");
    }

    logs.debug("cleaning exported keystores and slashing protection");

    // Clean up DAPPMANAGER temp files
    cleanExportedKeystoresAndSlashingProtection();

    if (client === "prysm") {
      logs.debug("removing backup from prysm docker volume");
      // If Prysm: delete validator keys from validator volume
      await shell([
        "docker run",
        "--rm",
        `--name ${params.CONTAINER_TOOL_NAME_PREFIX}prysm-migration`,
        `--volume ${prysmOldValidatorVolumeName}:/root/`,
        alpineImage,
        "rm -rf /root/.eth2validators.backup"
      ]).catch(e => {
        throw extendError(e, "Error deleting prysm validator volume");
      });
    } else {
      logs.debug("removing prysm package");
      // If NOT Prysm: Delete prysm package
      await packageRemove({ dnpName: prysmOldDnpName, deleteVolumes: true });
    }
  } catch (e) {
    logs.error("Error migrating", e);
    throw extendError(e, "Eth2 migration failed");
  }
}
