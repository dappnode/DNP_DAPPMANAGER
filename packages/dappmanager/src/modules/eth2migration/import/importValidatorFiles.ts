import getDappmanagerImage from "../../../utils/getDappmanagerImage";
import { extendError } from "../../../utils/extendError";
import shell, { shellHost } from "../../../utils/shell";
import { eth2migrationParams } from "../params";
import { logs } from "../../../logs";

/**
 * Import validator into web3signer by calling API endpoint using an intermedium container with the backup attached volume
 * - Docs: https://consensys.github.io/web3signer/web3signer-eth2.html#operation/KEYMANAGER_IMPORT
 * - Files needed :
 *  - validator_keystore_x.json
 *  - walletpassword.txt
 *  - slashing_protection.json
 */
export async function importValidatorFiles({
  signerContainerName,
  volume
}: {
  signerContainerName: string;
  volume: string;
}): Promise<void> {
  try {
    // Get validator keystores files
    const keystoresFiles = await getValidatorKeystores(volume);

    // Get dappmanager image
    const image = await getDappmanagerImage();

    for await (const keystoreFile of keystoresFiles) {
      // Define entrypoint
      const entrypoint = `/bin/sh curl -X POST -H "Content-Type: application/json" 
-F '"keystores": [@${eth2migrationParams.backup.backupDir}/${keystoreFile}]'}]' 
-F '"passwords": [@${eth2migrationParams.backup.backupWalletPasswordFile}}]' 
-F '"slashing_protection": @${eth2migrationParams.backup.backupSlashingProtectionFile}}'
 http://${signerContainerName}/eth/v1/keystores"`;

      // Set up an intermedium container to call the API endpoint
      const output = await shell(
        `docker run --rm --volume=${volume} --entrypoint=${entrypoint} ${image}`
      ).catch(e => {
        throw extendError(e, `import ${keystoreFile} failed`);
      });
      logs.info(`successfully imported validator: ${output}`);
    }
  } catch (e) {
    throw extendError(e, "Eth2 migration: importValidatorFiles failed");
  }
}

/**
 * Get validator keystores files from backup volume
 * Keystores are formatted in the following way:
 * keystore-0.json  keystore-1.json
 */
async function getValidatorKeystores(volume: string): Promise<string[]> {
  try {
    const files = await shellHost(`ls /etc/docker/volumes/${volume}/keystore*`);
    logs.info(`found ${files.length} validator keystore files`);
    return files.split(" ");
  } catch (e) {
    throw extendError(e, "getValidatorKeystores failed");
  }
}
