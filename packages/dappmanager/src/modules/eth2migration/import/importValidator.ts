import Dockerode from "dockerode";
import { extendError } from "../../../utils/extendError";
import fetch from "node-fetch";
import { ValidatorFiles } from "../params";

/**
 * Import validator into web3signer by calling API endpoint: /eth/v1/keystores
 * - Docs: https://consensys.github.io/web3signer/web3signer-eth2.html#operation/KEYMANAGER_IMPORT
 * - Files needed :
 *  - validator_keystore_x.json
 *  - walletpassword.txt
 *  - slashing_protection.json
 */
export async function importValidatorFiles({
  signerDnpName,
  validatorFiles
}: {
  signerDnpName: string;
  validatorFiles: ValidatorFiles;
}): Promise<void> {
  try {
    const res = await fetch(signerDnpName, {
      method: "post",
      body: validatorFiles,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    throw extendError(e, "Eth2 migration: importValidatorFiles failed");
  }
}
