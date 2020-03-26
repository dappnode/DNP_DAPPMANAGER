/**
 * Aggregate types
 */

/**
 * Resolver types
 */

export interface PkgsObj {
  [dnpName: string]: string[];
}

export interface DappGetDnp {
  versions: {
    [version: string]: {
      [dependencyName: string]: string;
    };
  };
  isRequest?: boolean;
  isInstalled?: boolean;
}

export interface DappGetDnps {
  [dnpName: string]: DappGetDnp;
}

type VersionInternalResolver = string | null;

interface PermutationTableInterface {
  name: string;
  versions: (VersionInternalResolver)[];
  n: number;
  m: number;
}

export type PermutationsTableInterface = PermutationTableInterface[];

export interface PermutationInterface {
  [dnpName: string]: VersionInternalResolver;
}

export interface StateInternalInterface {
  [dnpName: string]: VersionInternalResolver;
}

export interface DappGetState {
  [dnpName: string]: string; // version
}

export interface DappGetErrors {
  [errorKey: string]: number;
}

export interface DappGetResult {
  message: string;
  state: DappGetState;
  alreadyUpdated: DappGetState;
  currentVersion: DappGetState;
}
