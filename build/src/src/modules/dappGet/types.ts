import { Dependencies } from "../../types";

/**
 * Aggregate types
 */

export interface DnpsRepo {
  [dnpName: string]: {
    [version: string]: Dependencies;
  };
}

export interface FetchFunction {
  dependencies: ({
    name,
    ver
  }: {
    name: string;
    ver: string;
  }) => Promise<Dependencies>;
  versions: ({
    name,
    versionRange
  }: {
    name: string;
    versionRange: string;
  }) => Promise<string[]>;
}

/**
 * Resolver types
 */

export interface PkgsObj {
  [dnpName: string]: string[];
}

export interface DnpInterface {
  versions: {
    [version: string]: {
      [dependencyName: string]: string;
    };
  };
  isRequest?: boolean;
  isInstalled?: boolean;
}

export interface DnpsInterface {
  [dnpName: string]: DnpInterface;
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

export interface StateInterface {
  [dnpName: string]: string;
}

export interface ErrorsInterface {
  [errorKey: string]: number;
}

export interface ResultInterface {
  message: string;
  state: StateInterface;
  alreadyUpdated: StateInterface;
}
