/**
 * Aggregate types
 */

export interface DependenciesInterface {
  [dependencyName: string]: string;
}

export interface DnpsRepo {
  [dnpName: string]: {
    [version: string]: DependenciesInterface;
  };
}

export interface FetchFunction {
  dependencies: ({
    name,
    ver
  }: {
    name: string;
    ver: string;
  }) => Promise<DependenciesInterface>;
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

export interface StateInterface {
  [dnpName: string]: VersionInternalResolver;
}

export interface ErrorsInterface {
  [errorKey: string]: number;
}
