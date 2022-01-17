import fs from "fs";
import fetch from "node-fetch";
import { extendError } from "../../utils/extendError";
import { shellHost } from "../../utils/shell";
import { logs } from "../../logs";

/**
 * Import validator into web3signer by calling API endpoint using an intermedium container with the backup attached volume
 * - Docs: https://consensys.github.io/web3signer/web3signer-eth2.html#operation/KEYMANAGER_IMPORT
 * - Files needed :
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
  const web3signerApiUrl = `http://${signerDnpName}`;

  // Check web3signer status check: https://consensys.github.io/web3signer/web3signer-eth2.html#tag/Server-Status
  const response = await fetch(`${web3signerApiUrl}/upcheck`);

  logs.info("web3signer status check: ", status);

  const importKeystoresPostData = {
    keystores: keystoresStr,
    passwords: keystoresStr.map(() => keystorePasswordStr),
    slashing_protection: slashingProtectionStr
  };

  // TODO: Check status code for partial success
  const res = await fetch(`${web3signerApiUrl}}/eth/v1/keystores`, {
    method: "POST",
    body: JSON.stringify(importKeystoresPostData)
  });

  // TODO: Handle request
  // TODO: Retry on error?
  // TODO: Handle response statuses https://github.com/ethereum/keymanager-APIs/blob/08105e7aaaff1a1f2f52a58befa33937dd581e9d/keymanager-oapi.yaml#L131
  if (!res.ok) {
    const body = await res.json();
  } else {
    const body = await res.json();
  }

  logs.info("successfully imported validators");

  const response = await fetch(`${web3signerApiUrl}/api/v1/eth2/publicKeys`, {
    method: "get",
    headers: { "Content-Type": "application/json" }
  });

  const pubKeys = await response.json();
  if (pubKeys.length === 0) {
    throw new Error("No validator public keys found");
  }
  logs.info(
    "Eth2 migration: verifyImport succesful for public keys: ",
    pubKeys
  );
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
