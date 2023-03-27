import { Dependencies } from "@dappnode/dappnodesdk/types";
import { DappGetDnps, DappGetDnp } from "../types.js";
import { sanitizeDependencies } from "./sanitizeDependencies.js";

function getVersion(
  dnps: DappGetDnps,
  name: string,
  version: string
): {
  [dependencyName: string]: string;
} {
  return ((dnps[name] || {}).versions || {})[version];
}

export function hasVersion(
  dnps: DappGetDnps,
  name: string,
  version: string
): boolean {
  return Boolean(getVersion(dnps, name, version));
}

export function getDependencies(
  dnps: DappGetDnps,
  name: string,
  version: string
): Dependencies {
  return getVersion(dnps, name, version);
}

export function setVersion(
  dnps: DappGetDnps,
  name: string,
  version: string,
  dependencies: Dependencies
): void {
  if (!dnps[name]) dnps[name] = { versions: {} };
  dnps[name].versions[version] = sanitizeDependencies(dependencies);
}

export function getVersionsFromDnp(dnp: DappGetDnp): {
  [version: string]: {
    [dependencyName: string]: string;
  };
} {
  return dnp.versions;
}

export function toReq(name: string, version: string): string {
  return [name || "no-name", version || "no-version"].join("@");
}
