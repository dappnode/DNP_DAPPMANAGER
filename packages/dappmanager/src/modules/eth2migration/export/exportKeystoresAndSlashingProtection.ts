import fs from "fs";
import path from "path";
import os from "os";
import { Eth2Network } from "../params";
import shell from "../../../utils/shell";
import {
  prysmMigrationContainerName,
  outputVolumeName,
  dappmanagerOutPaths
} from "./params";
import { logs } from "../../../logs";

/**
 * Export eth2 validator from Prysm non-web3signer version to docker volume:
 * - backup.zip: contains keystore-x.json
 * - walletpassword.txt
 * - slashing_protection.json
 */
export async function exportKeystoresAndSlashingProtection({
  network,
  prysmOldValidatorImage,
  prysmOldValidatorVolumeName,
  prysmOldWalletDirRelativePath,
  alpineImage
}: {
  network: Eth2Network;
  prysmOldValidatorImage: string;
  /** Prysm validator volume name for a specific package: prysmdnpdappnodeeth_validator-data */
  prysmOldValidatorVolumeName: string;
  /**
   * Before this step the wallet dir (typically in '.eth2validators') may be moved to a different location.
   * This is a relative path from the volume 'validator-data' (typically binded at /root).
   */
  prysmOldWalletDirRelativePath: string;
  /** Image to run cp command */
  alpineImage: string;
}): Promise<void> {
  /** Prysm paths relative to the Prysm validator container */
  const prysmPathWalletDir = path.join("/root", prysmOldWalletDirRelativePath);
  const prysmPaths = {
    rootDir: "/root",
    outVolumeTarget: "/out",
    outDir: "/out",
    walletDir: prysmPathWalletDir,
    /**
     * Outputs file at /out/backup/backup.zip
     * MUST be a new path for Prysm to give it a set permissions different than docker's directories
     */
    backupOutDir: "/out/backup",
    walletpasswordFilepath: path.join(prysmPathWalletDir, "walletpassword.txt"),
    walletpasswordOutFilepath: "/out/walletpassword.txt",
    /** Outputs file at /out/slashing_protection.json */
    slashingProtectionOutDir: "/out"
  };

  logs.debug("Listing validator accounts");

  // List keys
  // - Example command: validator accounts list --wallet-dir=/root/.eth2validators --wallet-password-file=/root/.eth2validators/walletpassword.txt --prater
  // TODO: deep test this command, check if might be pagination. ask for an --all flag in github issue
  const validatorAccountsData = await shell(
    [
      "docker run",
      "--rm",
      `--name ${prysmMigrationContainerName}`,
      `--volume ${prysmOldValidatorVolumeName}:${prysmPaths.rootDir}`,
      "--entrypoint=/usr/local/bin/validator",
      prysmOldValidatorImage,
      "accounts list",
      `--wallet-dir=${prysmPaths.walletDir}`,
      `--wallet-password-file=${prysmPaths.walletpasswordFilepath}`,
      `--${network}`,
      "--accept-terms-of-use"
    ],
    { errorMessage: "validator accounts list failed" }
  );

  // Get public keys in a string comma separated
  const validatorPubkeysHex = parseValidatorPubkeysHexFromListOutput(
    validatorAccountsData
  );

  logs.debug(
    `Exporting keystores to ${prysmPaths.outDir} pubkeys: ${validatorPubkeysHex}`
  );

  // Export keys to a .zip file
  // Writes to a file named 'backup.zip' in `--backup-dir`
  //
  // $ Example command: validator accounts backup --wallet-dir=/root/.eth2validators --wallet-password-file=/root/.eth2validators/walletpassword.txt --backup-dir=/root --backup-password-file=/root/.eth2validators/walletpassword.txt --backup-public-keys=0x80b11b83eb8c1858c657dc55936bd4b47d2418c8906777cecae9c14495796f3d52b44652684e25e9ebb3e9efcfea33c6,0x8ac669f5180ae1de36db123114657437fd2cd3f51e838aa327d6739ff28907731462e0832fb9eb190972cfd652b2a775 --prater
  await shell(
    [
      "docker run",
      "--rm",
      `--name ${prysmMigrationContainerName}`,
      `--volume ${prysmOldValidatorVolumeName}:${prysmPaths.rootDir}`,
      `--volume ${outputVolumeName}:${prysmPaths.outVolumeTarget}`,
      "--entrypoint=/usr/local/bin/validator",
      prysmOldValidatorImage,
      "accounts backup",
      `--wallet-dir=${prysmPaths.walletDir}`,
      `--wallet-password-file=${prysmPaths.walletpasswordFilepath}`,
      `--backup-dir=${prysmPaths.backupOutDir}`,
      `--backup-password-file=${prysmPaths.walletpasswordFilepath}`,
      `--backup-public-keys=${validatorPubkeysHex.join(",")}`,
      `--${network}`,
      "--accept-terms-of-use"
    ],
    { errorMessage: "validator accounts backup failed" }
  );

  logs.debug("Copying walletpassword to backup folder");

  // Copy walletpassowrd to backup folder
  await shell(
    [
      "docker run",
      "--rm",
      `--name ${prysmMigrationContainerName}`,
      `--volume ${prysmOldValidatorVolumeName}:${prysmPaths.rootDir}`,
      `--volume ${outputVolumeName}:${prysmPaths.outDir}`,
      alpineImage,
      `cp ${prysmPaths.walletpasswordFilepath} ${prysmPaths.walletpasswordOutFilepath}`
    ],
    { errorMessage: "walletpassword.txt copy failed" }
  );

  logs.debug("Exporting slashing protection data");

  // Export slashing-protection to interchange JSON file
  // Writes to a file named 'slashing_protection.json' in `--datadir`
  //
  // $ validator slashing-protection-history export --datadir=/root/.eth2validators.backup --slashing-protection-export-dir=/root --accept-terms-of-use --prater
  await shell(
    [
      "docker run",
      "--rm",
      `--name ${prysmMigrationContainerName}`,
      `--volume ${prysmOldValidatorVolumeName}:${prysmPaths.rootDir}`,
      `--volume ${outputVolumeName}:${prysmPaths.outDir}`,
      "--entrypoint=/usr/local/bin/validator",
      prysmOldValidatorImage,
      "slashing-protection-history export",
      `--datadir=${prysmPaths.walletDir}`,
      `--slashing-protection-export-dir=${prysmPaths.slashingProtectionOutDir}`,
      `--${network}`,
      "--accept-terms-of-use"
    ],
    { errorMessage: "Eth2 migration: exportSlashingProtectionData failed" }
  );

  if (os.userInfo().username !== "root") {
    logs.debug("Changing backup dir permissions to allow reading by non-root");
    // The backup directory created by the Prysm container can only be read by its owner.
    // In local integration tests that's the root user
    // drwx------ 2 root root 4096 ene 20 19:35 backup
    await shell(
      [
        "docker run",
        "--rm",
        `--name ${prysmMigrationContainerName}`,
        `--volume ${outputVolumeName}:${prysmPaths.outVolumeTarget}`,
        "--entrypoint=''",
        prysmOldValidatorImage,
        `chmod -R 777 ${prysmPaths.outDir}`
      ],
      { errorMessage: "change of outDir permissions failed" }
    );
  } else {
    logs.debug("Skipping changing backup dir permissions, user is root");
  }

  logs.debug("Checking exported files");

  // Verify content is in host volume:
  //  - backup.zip and the unziped content (keystore_x.json)
  //  - slashing_protection.json
  //  - walletpassword.txt
  for (const expectedFilePath of [
    dappmanagerOutPaths.walletpasswordOutFilepath,
    dappmanagerOutPaths.slashingProtectionOutFilepath,
    dappmanagerOutPaths.backupOutFilepath
  ]) {
    if (!fs.existsSync(expectedFilePath)) {
      const filepath = path.parse(expectedFilePath);
      const filesInDir = fs.existsSync(filepath.dir)
        ? fs.readdirSync(filepath.dir)
        : null;

      throw Error(`${filepath.base} file not found at ${expectedFilePath}
Files in dir: ${filesInDir ? filesInDir.join(" ") : "dir does not exist"}`);
    }
  }

  logs.debug("Extracting keystores backup zip");

  // Extract zip
  await shell(
    [
      // The backup directory created by the Prysm container can only be read by its owner.
      // In local integration tests that's the root user
      // drwx------ 2 root root 4096 ene 20 19:35 backup
      // So we must unzip with sudo
      "unzip",
      dappmanagerOutPaths.backupOutFilepath,
      `-d ${dappmanagerOutPaths.keystoresOutDir}`
    ],
    { errorMessage: "Error unzip backup.zip file" }
  );
}

/**
 * Return a string with the public keys comma separated
 * @param validatorAccountsData output from prysm `validator accounts list`
 * ```
 * [2021-12-15 11:38:36]  WARN flags: Running on Ethereum Consensus Mainnet
 * (keymanager kind) imported wallet
 *
 * Showing 2 validator accounts
 * View the eth1 deposit transaction data for your accounts by running \`validator accounts list --show-deposit-data\`
 *
 * Account 0 | definitely-evolving-honeybee
 * [validating public key] 0x80b11b83eb8c1858c657dc55936bd4b47d2418c8906777cecae9c14495796f3d52b44652684e25e9ebb3e9efcfea33c6
 *
 * Account 1 | implicitly-ultimate-emu
 * [validating public key] 0x8ac669f5180ae1de36db123114657437fd2cd3f51e838aa327d6739ff28907731462e0832fb9eb190972cfd652b2a775
 * ```
 */
export function parseValidatorPubkeysHexFromListOutput(
  validatorAccountsData: string
): string[] {
  const validatorAccounts = validatorAccountsData.match(/(0x[0-9a-fA-F]{96})/g);
  if (!validatorAccounts) throw Error("No validator accounts found");
  return validatorAccounts;
}
