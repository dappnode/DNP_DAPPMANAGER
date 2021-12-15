import { Eth2Network } from "../params";
import { exportValidatorKeys } from "./exportKeys";
import { exportSlashingProtectionData } from "./exportSlashing";
import { checkExportRequirements } from "./checkRequirements";
import { verifyExport } from "./verifyExport";
import Dockerode from "dockerode";
import { extendError } from "../../../utils/extendError";

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
    // Check backup requirements
    await checkExportRequirements({ containerName, volume });

    // Backup keys
    await exportValidatorKeys({ network, containerName });
    // Backup slashing protection
    await exportSlashingProtectionData({ network, containerName });

    // Verify backup
    await verifyExport(volume);
  } catch (e) {
    throw extendError(e, "Eth2 migration: backup failed");
  }
}
