import { extendError } from "../../../utils/extendError";
import { ValidatorFiles } from "../params";
import { checkImportRequirements } from "./checkImportRequirements";
import { importValidatorFiles } from "./importValidator";
import { verifyImport } from "./verifyImport";

/** Import validator public keys into eth2-client web3signer */
export async function importValidator({
  signerDnpName,
  validatorFiles
}: {
  signerDnpName: string;
  validatorFiles: ValidatorFiles;
}): Promise<void> {
  try {
    // Check import requirements
    await checkImportRequirements({ signerDnpName });

    // Import validator: validator_keystore_x.json and walletpassword.txt and slashing_protection.json
    await importValidatorFiles({ signerDnpName, validatorFiles });

    // Verify import
    await verifyImport();

    // Restart web3signer ??
  } catch (e) {
    throw extendError(e, "Eth2 migration: import failed");
  }
}
