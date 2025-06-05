/**
 * APM version
 */

export interface ApmVersionRaw {
  version: string;
  contentUri: string;
}

/**
 * Data fetch from blockchain state. Must exists
 */
export interface ApmVersionState extends ApmVersionRaw {
  version: string;
  versionId: number;
}

export interface ApmVersionRawAndOrigin extends ApmVersionRaw {
  origin?: string;
}

export interface ApmRepoVersionReturn {
  semanticVersion: number[]; // uint16[3]
  contractAddress: string; // address
  contentURI: string; // bytes
}

export interface PackageRequest {
  name: string;
  ver: string;
  req?: string;
}
