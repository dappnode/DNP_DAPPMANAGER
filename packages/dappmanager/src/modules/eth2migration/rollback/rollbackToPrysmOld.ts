import { packageInstall, packageRemove } from "../../../calls";
import params from "../../../params";
import { extendError } from "../../../utils/extendError";
import shell from "../../../utils/shell";

/**
 * Rollback to the previous state before the migration
 * - Delete completely web3signer package
 * - Move .eth2validators.backup to .eth2validators
 * - Install last version of Prysm old capable of validating
 * - Use of docker volume:
 *    - Beacon chain volume should exist
 *    - Validator volume should exist
 */
export async function rollbackToPrysmOld({
  signerDnpName,
  alpineImage,
  prysmOldValidatorVolumeName,
  prysmOldStableVersion,
  prysmOldDnpName
}: {
  signerDnpName: string;
  alpineImage: string;
  prysmOldValidatorVolumeName: string;
  prysmOldStableVersion: string;
  prysmOldDnpName: string;
}): Promise<void> {
  // Delete web3signer package and volumes
  await packageRemove({ dnpName: signerDnpName });

  // Move .eth2validators.backup to .eth2validators
  await shell([
    "docker run",
    "--rm",
    `--name ${params.CONTAINER_TOOL_NAME_PREFIX}prysm-migration`,
    `--volume ${prysmOldValidatorVolumeName}:/root/`,
    alpineImage,
    "mv /root/.eth2validators.backup /root/.eth2validators"
  ]).catch(e => {
    throw extendError(e, "Error moving Prysm's legacy wallet directory");
  });

  // Install last version of Prysm old capable of validating
  await packageInstall({
    name: prysmOldDnpName,
    version: prysmOldStableVersion
  }).catch(e => {
    throw extendError(e, "Error installing Prysm old");
  });
}
