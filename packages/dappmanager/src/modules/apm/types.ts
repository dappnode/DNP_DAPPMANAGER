import { ApmVersionRaw } from "@dappnode/toolkit";

/**
 * Data fetch from blockchain events. May not exist
 */
export interface ApmVersionMetadata {
  version: string;
  txHash?: string; // '0x43f390d7a2ac19e89e902c2bef3dc84c563e3fd17a354eed664bd6527aeac97d',
  blockNumber?: number; // 9573077,
  timestamp?: number; // 1582905556,
}

/**
 * Data fetch from blockchain state. Must exists
 */
export interface ApmVersionState extends ApmVersionRaw {
  version: string;
  versionId: number;
}
