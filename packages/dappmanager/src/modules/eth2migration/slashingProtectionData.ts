import { Eth2Network } from "./params";

/**
 * Exports the slashing protection history from validator
 * container to docker volume
 */
export async function backupSlashingProtectionData({
  network,
  dnpName,
  containerName
}: {
  network: Eth2Network;
  dnpName: string;
  containerName: string;
}): Promise<void> {
  // validator slashing-protection-history export --datadir=/root/.eth2validators --slashing-protection-export-dir=/root --accept-terms-of-use --prater
}
