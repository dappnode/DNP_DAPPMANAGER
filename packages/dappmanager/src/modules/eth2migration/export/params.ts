import params from "../../../params";

/** Volume name to output data to */
export const outputVolumeName = "dappmanagerdnpdappnodeeth_data";
/** Temporal (removed) migration container name */
export const prysmMigrationContainerName = `${params.CONTAINER_TOOL_NAME_PREFIX}prysm-migration`;

export const dappmanagerOutPaths = {
  outVolumeTarget: "/usr/src/app/dnp_repo/prysm-migration",
  walletDir: "/root/.eth2validators",
  // Written in prysmPaths.outDir
  walletpasswordOutFilepath:
    "/usr/src/app/dnp_repo/prysm-migration/walletpassword.txt",
  // Written in prysmPaths.outDir
  backupOutFilepath: "/usr/src/app/dnp_repo/prysm-migration/backup.zip",
  // Written in prysmPaths.outDir
  slashingProtectionOutFilepath:
    "/usr/src/app/dnp_repo/prysm-migration/slashing_protection.json",
  // Created latter as unzip target
  keystoresOutDir: "/usr/src/app/dnp_repo/prysm-migration/keystores"
};
