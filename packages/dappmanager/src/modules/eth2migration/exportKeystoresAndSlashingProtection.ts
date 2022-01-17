import fs from "fs";
import path from "path";
import { Eth2Network } from "./params";
import shell from "../../utils/shell";
import params from "../../params";
import { logs } from "../../logs";

/** Volume name to output data to */
const outputVolumeName = "dappmanagerdnpdappnodeeth_data";
/** Temporal (removed) migration container name */
const prysmMigrationContainerName = `${params.CONTAINER_TOOL_NAME_PREFIX}prysm-migration`;

const dappmanagerOutPaths = {
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
    outDir: "/out/prysm-migration",
    walletDir: prysmPathWalletDir,
    walletpasswordFilepath: path.join(prysmPathWalletDir, "walletpassword.txt"),
    walletpasswordOutFilepath: "/out/prysm-migration/walletpassword.txt"
  };

  // Copy walletpassowrd to backup folder
  await shell(
    [
      "docker run",
      "--rm",
      `--name ${prysmMigrationContainerName}`,
      `--volume ${prysmOldValidatorVolumeName}:${prysmPaths.rootDir}`,
      `--volume ${outputVolumeName}:${prysmPaths.outDir}`,
      alpineImage,
      "cp",
      prysmPaths.walletpasswordFilepath,
      prysmPaths.walletpasswordOutFilepath
    ],
    { errorMessage: "walletpassword.txt copy failed" }
  );

  // List keys
  // - Example command: validator accounts list --wallet-dir=/root/.eth2validators --wallet-password-file=/root/.eth2validators/walletpassword.txt --prater
  const validatorAccountsData = await shell(
    [
      "docker run",
      "--rm",
      `--name ${prysmMigrationContainerName}`,
      `--volume ${outputVolumeName}:${prysmPaths.outDir}`,
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
      `--volume ${outputVolumeName}:${prysmPaths.outDir}`,
      "--entrypoint=/usr/local/bin/validator",
      prysmOldValidatorImage,
      "accounts backup",
      `--wallet-dir=${prysmPaths.walletDir}`,
      `--wallet-password-file=${prysmPaths.walletpasswordFilepath}`,
      `--backup-dir=${prysmPaths.outDir}`,
      `--backup-password-file=${prysmPaths.walletpasswordFilepath}`,
      `--backup-public-keys=${validatorPubkeysHex.join(",")}`,
      `--${network}`,
      "--accept-terms-of-use"
    ],
    { errorMessage: "validator accounts backup failed" }
  );

  // Export slashing-protection to interchange JSON file
  // Writes to a file named 'slashing_protection.json' in `--datadir`
  //
  // $ validator slashing-protection-history export --datadir=/root/.eth2validators --slashing-protection-export-dir=/root --accept-terms-of-use --prater
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
      `--slashing-protection-export-dir=${prysmPaths.outDir}`,
      `--${network}`,
      "--accept-terms-of-use"
    ],
    { errorMessage: "Eth2 migration: exportSlashingProtectionData failed" }
  );

  // Verify content is in host volume:
  // - backup.zip and the unziped content (keystore_x.json)
  // - slashing_protection.json
  // - walletpassword.txt
  if (!fs.existsSync(dappmanagerOutPaths.backupOutFilepath)) {
    throw Error(
      `backup.zip file not found in ${dappmanagerOutPaths.backupOutFilepath}`
    );
  }
  if (!fs.existsSync(dappmanagerOutPaths.walletpasswordOutFilepath)) {
    throw Error(
      `walletpassword.txt file not found in ${dappmanagerOutPaths.walletpasswordOutFilepath}`
    );
  }
  if (!fs.existsSync(dappmanagerOutPaths.slashingProtectionOutFilepath)) {
    throw Error(
      `slashing_protection.json file not found in ${dappmanagerOutPaths.slashingProtectionOutFilepath}`
    );
  }

  // Extract zip
  await shell(
    [
      "unzip",
      dappmanagerOutPaths.backupOutFilepath,
      `-d ${dappmanagerOutPaths.keystoresOutDir}`
    ],
    { errorMessage: "Error unzip backup.zip file" }
  );
}

export function readExportedKeystoresAndSlashingProtection(): {
  keystoresStr: string[];
  keystorePasswordStr: string;
  slashingProtectionStr: string;
} {
  const keystoresStr: string[] = [];
  const keystorePaths = fs.readdirSync(dappmanagerOutPaths.keystoresOutDir);
  for (const keystoreFilename of keystorePaths) {
    const keystoreFilepath = path.join(
      dappmanagerOutPaths.keystoresOutDir,
      keystoreFilename
    );
    keystoresStr.push(fs.readFileSync(keystoreFilepath, "utf8"));
  }

  return {
    keystoresStr,
    keystorePasswordStr: fs
      .readFileSync(dappmanagerOutPaths.walletpasswordOutFilepath, "utf8")
      .trim(),
    slashingProtectionStr: fs.readFileSync(
      dappmanagerOutPaths.slashingProtectionOutFilepath,
      "utf8"
    )
  };
}

export function cleanExportedKeystoresAndSlashingProtection(): void {
  for (const filepath of [
    dappmanagerOutPaths.walletpasswordOutFilepath,
    dappmanagerOutPaths.backupOutFilepath,
    dappmanagerOutPaths.slashingProtectionOutFilepath
  ]) {
    try {
      fs.unlinkSync(filepath);
    } catch (e) {
      if (e.code !== "ENOENT") {
        logs.error(`Error cleaning Prysm migration file ${filepath}`, e);
      }
    }
  }

  try {
    fs.rmdirSync(dappmanagerOutPaths.keystoresOutDir, { recursive: true });
  } catch (e) {
    if (e.code !== "ENOENT") {
      logs.error("Error cleaning Prysm migration keystores dir", e);
    }
  }
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
