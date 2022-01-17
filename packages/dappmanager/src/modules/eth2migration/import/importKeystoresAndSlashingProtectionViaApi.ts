import { logs } from "../../../logs";
import { Web3signerImportResponse } from "../params";
import { Web3Signer } from "../web3signer";

/**
 * Import validator into web3signer by calling API endpoint using an intermedium container with the backup attached volume
 * - Docs: https://consensys.github.io/web3signer/web3signer-eth2.html#operation/KEYMANAGER_IMPORT
 * - Files needed:
 *  - validator_keystore_x.json
 *  - walletpassword.txt
 *  - slashing_protection.json
 */
export async function importKeystoresAndSlashingProtectionViaApi({
  signerDnpName,
  keystoresStr,
  keystorePasswordStr,
  slashingProtectionStr
}: {
  signerDnpName: string;
  keystoresStr: string[];
  keystorePasswordStr: string;
  slashingProtectionStr: string;
}): Promise<void> {
  // Get web3signer instance
  const web3signerApiUrl = `http://${signerDnpName}`;
  const web3signer = new Web3Signer(web3signerApiUrl);

  // web3signer upcheck
  const statusResponse = await web3signer.upcheck();
  logs.info("web3signer status check: ", statusResponse);
  if (statusResponse.toUpperCase().trim() !== "OK")
    throw Error("web3signer is not up");

  // web3signer import keystores
  const importResponse = await web3signer.importKeystores({
    keystores: keystoresStr,
    passwords: keystoresStr.map(() => keystorePasswordStr),
    slashing_protection: slashingProtectionStr
  });
  if (allKeystoresSuccess(importResponse))
    logs.info("successfully imported validators: ", importResponse.data);
  else {
    // TODO: retry on error for unsuccess imported keystores
    logs.error("failed to import validators: ", importResponse.data);
    throw Error("failed to import validators");
  }

  // web3signer verify import with list keystores
  const listResponse = await web3signer.listKeystores();
  // TODO: verify each pubkey
  const pubKeys = listResponse.data.map(keystore => keystore.validating_pubkey);
  if (pubKeys.length === 0) {
    throw new Error("No validator public keys found");
  }
  logs.info(
    "Eth2 migration: verifyImport succesful for public keys: ",
    pubKeys
  );
}

function allKeystoresSuccess(
  importResponse: Web3signerImportResponse
): boolean {
  return importResponse.data.every(
    keystore => keystore.status.toLowerCase().trim() === "imported"
  );
}
