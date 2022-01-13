import { extendError } from "../../../utils/extendError";
import { checkImportRequirements } from "./checkImportRequirements";
import { importValidatorFiles } from "./importValidatorFiles";
import { verifyImport } from "./verifyImport";

/** Import validator public keys and slashing_protection into eth2-client web3signer */
export async function importValidator({
  newEth2ClientDnpName,
  signerDnpName,
  signerContainerName,
  volume
}: {
  newEth2ClientDnpName: string;
  signerDnpName: string;
  signerContainerName: string;
  volume: string;
}): Promise<void> {
  try {
    // Check import requirements
    await checkImportRequirements({ newEth2ClientDnpName, signerDnpName });

    // Import validator: validator_keystore_x.json and walletpassword.txt and slashing_protection.json
    await importValidatorFiles({ signerContainerName, volume });

    // Verify import
    await verifyImport({ signerDnpName });

    // Restart web3signer ??
  } catch (e) {
    throw extendError(e, "Eth2 migration: import failed");
  }
}
