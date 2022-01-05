import { packageGet, packageInstall } from "../../../calls";
import { logs } from "../../../logs";
import { extendError } from "../../../utils/extendError";

/**
 * Check web3signer package is installed, if not install it WITHOUT starting it
 */
export async function checkImportRequirements({
  signerDnpName
}: {
  signerDnpName: string;
}): Promise<void> {
  try {
    // Check web3signer package is installed, if not install it WITHOUT starting it
    await packageGet({
      dnpName: signerDnpName
    }).catch(async e => {
      // Consider typing error for dnp not found
      if (e.message.includes("No DNP was found for name")) {
        logs.info(
          "Eth2 migration: web3signer package not installed, installing it"
        );
        await packageInstall({
          name: signerDnpName
        }).catch(e => {
          throw extendError(e, "web3signer installation failled");
        });
      } else throw e;
    });
  } catch (e) {
    throw extendError(e, "Eth2 migration: checkExportRequirements failled");
  }
}
