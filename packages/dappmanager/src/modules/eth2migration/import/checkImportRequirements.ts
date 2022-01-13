import { packageGet, packageInstall, packageStartStop } from "../../../calls";
import { extendError } from "../../../utils/extendError";
import fetch from "node-fetch";
import { logs } from "../../../logs";

/**
 * Check import requiremments:
 * - web3signer package installed
 * - web3signer status check: https://consensys.github.io/web3signer/web3signer-eth2.html#tag/Server-Status
 * - containers from web3signers are running
 * - validator validator files: slashing, keystores
 * - Install eth2client package
 */
export async function checkImportRequirements({
  newEth2ClientDnpName,
  signerDnpName
}: {
  newEth2ClientDnpName: string;
  signerDnpName: string;
}): Promise<void> {
  try {
    // Check web3signer package is installed
    const web3SignerPackage = await packageGet({
      dnpName: signerDnpName
    }).catch(async e => {
      throw extendError(e, "web3signer package not installed");
    });

    // Check web3signer status check: https://consensys.github.io/web3signer/web3signer-eth2.html#tag/Server-Status
    const response = await fetch(`http://${signerDnpName}/upcheck`, {
      method: "get"
    });

    const status = await response.text();
    logs.info("web3signer status check: ", status);

    // Check all containers from web3signer package are running
    web3SignerPackage.containers.forEach(async container => {
      if (container.state === "running")
        await packageStartStop({ dnpName: signerDnpName });
    });

    // TODO Validate validator files

    // Install eth2 client web3signer version
    // TODO: install Prysm-web3signer version with beaconchain volume attached
    await packageInstall({ name: newEth2ClientDnpName }).catch(e => {
      throw extendError(e, `failed installing ${newEth2ClientDnpName}`);
    });
  } catch (e) {
    throw extendError(e, "Eth2 migration: checkExportRequirements failled");
  }
}

function validateValidatorFiles() {
  // TODO
}
