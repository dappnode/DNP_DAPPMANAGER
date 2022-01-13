import shell from "../../../utils/shell";
import { eth2migrationParams } from "../params";
import { extendError } from "../../../utils/extendError";
import Dockerode from "dockerode";
import { packageGet, packageInstall } from "../../../calls";
import { logs } from "../../../logs";

/**
 * Check export requirements:
 * - volume exists in host
 * - validator container has walletPassword and walletDir
 * - web3signer is installed, install it if necessary
 * @param validatorContainerName
 */
export async function checkExportRequirements({
  currentValidatorContainerName,
  volume,
  signerDnpName
}: {
  currentValidatorContainerName: string;
  volume: Dockerode.Volume;
  signerDnpName: string;
}): Promise<void> {
  try {
    // Volume exists in host
    if (!volume.name) throw Error(`Volume ${volume.name} not found`);

    // Validator container has walletdir and walletpassword file
    await shell(
      `docker exec ${currentValidatorContainerName} ls ${eth2migrationParams.keys.walletPasswordFile}`
    ).catch(e => {
      throw extendError(e, "walletdir or/and walletpassword file not found");
    });

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
    throw extendError(e, "Eth2 migration: backup requirements failed");
  }
}
