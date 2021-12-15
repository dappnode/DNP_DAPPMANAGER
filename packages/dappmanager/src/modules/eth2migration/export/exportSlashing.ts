import { Eth2Network } from "../params";
import shell from "../../../utils/shell";
import { extendError } from "../../../utils/extendError";

/**
 * Exports the slashing protection history from validator
 * container to docker volume
 */
export async function exportSlashingProtectionData({
  network,
  containerName
}: {
  network: Eth2Network;
  containerName: string;
}): Promise<void> {
  try {
    // validator slashing-protection-history export --datadir=/root/.eth2validators --slashing-protection-export-dir=/root --accept-terms-of-use --prater
    await shell(
      `docker exec ${containerName} validator slashing-protection-history export --datadir=/root/.eth2validators --slashing-protection-export-dir=/root \
--accept-terms-of-use --${network}`
    );
  } catch (e) {
    throw extendError(e, "Eth2 migration: exportSlashingProtectionData failed");
  }
}
