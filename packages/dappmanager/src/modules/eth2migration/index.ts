import {
  cleanExportedKeystoresAndSlashingProtection,
  exportKeystoresAndSlashingProtection,
  readExportedKeystoresAndSlashingProtection
} from "./exportKeystoresAndSlashingProtection";
import { getMigrationParams } from "./utils";
import { Eth2Client, Eth2Network } from "./params";
import { extendError } from "../../utils/extendError";
import { rollbackToPrysmOld } from "./rollbackToPrysmOld";
import shell from "../../utils/shell";
import { dockerContainerRemove, dockerVolumeRemove } from "../docker";
import { ensureWeb3SignerIsInstalledAndStopped } from "./web3signer";
import params from "../../params";
import { importKeystoresAndSlashingProtectionViaApi } from "./importKeystoresAndSlashingProtectionViaApi";
import { configValidatorToFollowWeb3signer } from "./configValidatorToFollowWeb3signer";
import { ensureEth2ClientIsInstalledAndSynced } from "./ensureEth2ClientIsInstalledAndSynced";
import getDappmanagerImage from "../../utils/getDappmanagerImage";

export async function eth2Migrate({
  client,
  network
}: {
  client: Eth2Client;
  network: Eth2Network;
}): Promise<void> {
  // Get params deppending on the network
  const {
    newEth2ClientDnpName,
    prysmOldDnpName,
    prysmOldValidatorContainerName,
    prysmOldValidatorVolumeName,
    signerDnpName,
    signerContainerName
  } = getMigrationParams(client, network);

  // Get SOME image to run 'cp' or 'rm' commands on Prysm's volume
  const alpineImage = await getDappmanagerImage();

  // prysmValidatorImage Fetch _SOME_ image from the available prysm package
  // MUST be fetched dynamically here because we don't know when user will do the migration
  // They may have an old version of Prysm or a newer version of Prysm.
  // 'prysm.dnp.dappnode.eth:0.1.5'
  const prysmOldValidatorImage: string = await getPrysmValidatorImage(
    prysmOldDnpName
  );

  // TODO: To ensure that the Prysm validator API is stable and works as expected,
  // ensure that the available prysm image is within some expected version range

  // Ensure Web3Signer:
  // - is installed
  // - has expected container
  await ensureWeb3SignerIsInstalledAndStopped({
    signerDnpName,
    signerContainerName
  });

  // TODO: Should ensure Web3Signer container is not running?

  // Ensure new Eth2 client is installed
  // TODO: Should it be done before hand?
  await ensureEth2ClientIsInstalledAndSynced({ dnpName: newEth2ClientDnpName });

  // - If to Prysm: The update will have deleted the old container
  // - If NOT to Prysm: Delete validator container
  if (client === "prysm") {
    // TODO: Ensure that old prysm capable of validating has been removed
  } else {
    await dockerContainerRemove(prysmOldValidatorContainerName);
  }

  try {
    // Ensure validator is stopped and won't be able to start again
    //
    // Validator command
    // --wallet-dir=/root/.eth2validators
    // --wallet-password-file=/root/.eth2wallets/wallet-password.txt
    //
    // Validator volumes
    // - "validator-data:/root/"

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

    // Tell next container to validate with the migrated keys
    await configValidatorToFollowWeb3signer(client);
  } catch (e) {
    cleanExportedKeystoresAndSlashingProtection();
    await rollbackToPrysmOld();

    throw extendError(e, "Eth2 migration failed");
  }

  // Clean up DAPPMANAGER temp files
  cleanExportedKeystoresAndSlashingProtection();

  // - If to Prysm: Only delete keys, don't delete volume
  // - If NOT to Prysm: Delete volume
  if (client === "prysm") {
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
    await dockerVolumeRemove(prysmOldValidatorVolumeName);
  }
}
