/**
 * Data fetch from blockchain events. May not exist
 */
export interface ApmVersionMetadata {
  txHash?: string; // '0x43f390d7a2ac19e89e902c2bef3dc84c563e3fd17a354eed664bd6527aeac97d',
  blockNumber?: number; // 9573077,
  timestamp?: number; // 1582905556,
}

/**
 * Data fetch from blockchain state. Must exists
 */
export interface ApmVersionState {
  versionId: number;
  version: string;
  contentUri: string;
}

export interface ApmVersion extends ApmVersionState, ApmVersionMetadata {}

export interface ApmRepoVersionReturn {
  semanticVersion: number[]; // uint16[3]
  contractAddress: string; // address
  contentURI: string; // bytes
}
