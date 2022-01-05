import { Eth2Network } from "../params";
import { exportValidatorKeys } from "./exportKeys";
import { exportSlashingProtectionData } from "./exportSlashing";
import { checkExportRequirements } from "./checkExportRequirements";
import { verifyExport } from "./verifyExport";
import Dockerode from "dockerode";
import { extendError } from "../../../utils/extendError";

/**
 * Export eth2 validator from Prysm non-web3signer version to docker volume:
 * - backup.zip: contains keystore-x.json
 * - walletpassword.txt
 * - slashing_protection.json
 */
export async function exportValidator({
  network,
  containerName,
  volume
}: {
  network: Eth2Network;
  containerName: string;
  volume: Dockerode.Volume;
}): Promise<void> {
  try {
    // Check export requirements
    await checkExportRequirements({ containerName, volume });

    // Export keys
    await exportValidatorKeys({ network, containerName });
    // Export slashing protection
    await exportSlashingProtectionData({ network, containerName });

    // Verify export
    await verifyExport(volume);
  } catch (e) {
    throw extendError(e, "Eth2 migration: export failed");
  }
}
