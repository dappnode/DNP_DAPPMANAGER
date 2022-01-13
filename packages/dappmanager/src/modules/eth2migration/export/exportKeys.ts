import { Eth2Network, eth2migrationParams } from "../params";
import shell from "../../../utils/shell";
import { parseValidatorAccounts } from "./utils";
import { extendError } from "../../../utils/extendError";

/**
 * Export validator public keys from Prysm-non-web3sgigner version:
 * - backup.zip: contains keystore-x.json
 * - walletpassword.txt
 */
export async function exportValidatorKeys({
  network,
  currentValidatorContainerName
}: {
  network: Eth2Network;
  currentValidatorContainerName: string;
}): Promise<void> {
  try {
    // 1. List keys
    // - Example command: validator accounts list --wallet-dir=/root/.eth2validators --wallet-password-file=/root/.eth2validators/walletpassword.txt --prater
    const validatorAccountsData = await shell(
      `docker exec ${currentValidatorContainerName} validator accounts list --wallet-dir=${eth2migrationParams.keys.walletDir} \
--wallet-password-file=${eth2migrationParams.keys.walletPasswordFile} --${network} --accept-terms-of-use`
    ).catch(e => {
      throw extendError(e, "validator accounts list failed");
    });

    // Get public keys in a string comma separated
    const validatorAccountsDataParsed = parseValidatorAccounts(
      validatorAccountsData
    );

    // 2. Copy walletpassowrd to backup folder
    await shell(
      `docker exec ${currentValidatorContainerName} cp ${eth2migrationParams.keys.walletPasswordFile} ${eth2migrationParams.backup.backupDir}`
    ).catch(e => {
      throw extendError(e, "walletpassword copy failed");
    });

    // 3. Export keys:
    //  - Backup generated at /root/backup.zip
    //  - Example command: validator accounts backup --wallet-dir=/root/.eth2validators --wallet-password-file=/root/.eth2validators/walletpassword.txt --backup-dir=/root --backup-password-file=/root/.eth2validators/walletpassword.txt --backup-public-keys=0x80b11b83eb8c1858c657dc55936bd4b47d2418c8906777cecae9c14495796f3d52b44652684e25e9ebb3e9efcfea33c6,0x8ac669f5180ae1de36db123114657437fd2cd3f51e838aa327d6739ff28907731462e0832fb9eb190972cfd652b2a775 --prater
    await shell(
      `docker exec ${currentValidatorContainerName} validator accounts backup --wallet-dir=${eth2migrationParams.keys.walletDir} \
--wallet-password-file=${eth2migrationParams.keys.walletPasswordFile} --backup-dir=${eth2migrationParams.backup.backupDir} \
--backup-password-file=${eth2migrationParams.keys.walletPasswordFile} --backup-public-keys=${validatorAccountsDataParsed} \
--${network} --accept-terms-of-use`
    ).catch(e => {
      throw extendError(e, "validator accounts backup failed");
    });

    // 4. Extract backup.zip
    await shell(
      `docker exec ${currentValidatorContainerName} sh -c 'apt update; apt install -y unzip; unzip -p ${eth2migrationParams.backup.backupKeysFile} -d ${eth2migrationParams.backup.backupDir}'`
    ).catch(e => {
      throw extendError(e, "unzip failed");
    });
  } catch (e) {
    // ROLLBACK: export directly from docker host volume
    // Docker host volume exists
    throw extendError(e, "Eth2 migration: exportKeys failed");
  }
}
