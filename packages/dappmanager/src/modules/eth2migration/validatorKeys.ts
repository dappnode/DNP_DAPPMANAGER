import { eth2migrationParams, Eth2Network } from "./params";
import shell from "../../utils/shell";
import { parseValidatorAccounts } from "./utils";
import { logs } from "../../logs";

// Eth2 migration:
// (deppends if Prysm will support web3signer or not, so it will be a Prysm self-destructive migration)
// 1. Is the Eth2 client (supports web3signer) installed and synced ?
//   1.2 If yes do the eth2 migration
//   1.3 If not, install it and sync it

/** Export validator public keys from Prysm-non-web3sgigner version */
export async function backupValidatorKeys({
  network,
  containerName
}: {
  network: Eth2Network;
  containerName: string;
}): Promise<void> {
  try {
    // BACKUP KEYS
    // 1. Get all validator accounst publicKeys
    // ? There could be validators with different passwords
    // - Example command: validator accounts list --wallet-dir=/root/.eth2validators --wallet-password-file=/root/.eth2validators/walletpassword.txt --prater
    const validatorAccountsData = await shell(
      `docker exec ${containerName} validator accounts list --wallet-dir=${eth2migrationParams.keys.walletDir} \
--wallet-password-file=${eth2migrationParams.keys.walletPasswordFile} --${network} --accept-terms-of-use`
    );

    const validatorAccountsDataParsed = parseValidatorAccounts(
      validatorAccountsData
    );

    // 2. Export keys:
    //  - Backup generated at /root/backup.zip
    //  - Example command: validator accounts backup --wallet-dir=/root/.eth2validators --wallet-password-file=/root/.eth2validators/walletpassword.txt --backup-dir=/root --backup-password-file=/root/.eth2validators/walletpassword.txt --backup-public-keys=0x80b11b83eb8c1858c657dc55936bd4b47d2418c8906777cecae9c14495796f3d52b44652684e25e9ebb3e9efcfea33c6,0x8ac669f5180ae1de36db123114657437fd2cd3f51e838aa327d6739ff28907731462e0832fb9eb190972cfd652b2a775 --prater
    shell(
      `docker exec ${containerName} validator accounts backup --wallet-dir=${eth2migrationParams.keys.walletDir} \
--wallet-password-file=${eth2migrationParams.keys.walletPasswordFile} --backup-dir=${eth2migrationParams.keys.backupKeysDir} \
--backup-password-file=${eth2migrationParams.keys.walletPasswordFile} --backup-public-keys=${validatorAccountsDataParsed} \
--${network} --accept-terms-of-use`
    )
      .then(() => logs.info("Eth2 migration: validator keys exported"))
      .catch(e => {
        e.message = `Validator keys not exported. ${e.message}`;
        logs.error(e);
        throw e;
      });
  } catch (e) {
    // ROLLBACK: export directly from docker host volume
    // Docker host volume exists
  }
}

/** Import validator public keys into eth2-client web3signer */
export async function importValidatorKeys(): Promise<void> {
  // Placing the keys in the web3signer container, in the volume /opt/web3signer/key_files_tmp
  // will make the web3signer entrypoint to generate the validator files necessary to the migration

  // CHECK REQUIREMENTS

  // 1. Verify web3signer is installed

  // 2. Verify the keys are correct

  // RUN WEB32SIGNER

  // 1. Upload backup.zip to web3signer container volume /opt/web3signer/key_files_tmp

  // 2. Run web3signer entrypoint to generate validator files

  console.log("hey");
}
