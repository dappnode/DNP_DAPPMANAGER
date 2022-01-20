import path from "path";
import params from "../../../params";

/** Volume name to output data to */
export const outputVolumeName = "dappmanagerdnpdappnodeeth_data";
/** Temporal (removed) migration container name */
export const prysmMigrationContainerName = `${params.CONTAINER_TOOL_NAME_PREFIX}prysm-migration`;

const dappmanagerDataContainerPath = process.env.TEST
  ? path.resolve(__dirname, "../../../../.test_data")
  : "/usr/src/app/dnp_repo/";

const dappmanagerOutPathOutVolumeTarget = path.join(
  dappmanagerDataContainerPath,
  "prysm-migration"
);

/**
 * Prysm old exports map:
 * - --volume dappmanagerdnpdappnodeeth_data:/out
 *
 * And exports to:
 * - /out/slashing_protection.json
 * - /out/backup/backup.zip
 * - /out/walletpassword.txt
 */
export const dappmanagerOutPaths = {
  outVolumeTarget: dappmanagerOutPathOutVolumeTarget,

  // Written in prysmPaths.backupOutDir
  backupOutFilepath: path.join(
    dappmanagerOutPathOutVolumeTarget,
    "backup/backup.zip"
  ),

  // Written in prysmPaths.walletpasswordOutFilepath
  walletpasswordOutFilepath: path.join(
    dappmanagerOutPathOutVolumeTarget,
    "walletpassword.txt"
  ),

  // Written in prysmPaths.slashingProtectionOutDir
  slashingProtectionOutFilepath: path.join(
    dappmanagerOutPathOutVolumeTarget,
    "slashing_protection.json"
  ),

  // Created latter as unzip target
  keystoresOutDir: path.join(dappmanagerOutPathOutVolumeTarget, "keystores")
};
