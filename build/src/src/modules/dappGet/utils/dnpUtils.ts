import { DnpsInterface, DnpInterface } from "../types";
import { Dependencies } from "../../../types";

export function getVersion(
  dnps: DnpsInterface,
  name: string,
  version: string
): {
  [dependencyName: string]: string;
} {
  return ((dnps[name] || {}).versions || {})[version];
}

export function hasVersion(
  dnps: DnpsInterface,
  name: string,
  version: string
): boolean {
  return Boolean(getVersion(dnps, name, version));
}

export function getDependencies(
  dnps: DnpsInterface,
  name: string,
  version: string
): Dependencies {
  return getVersion(dnps, name, version);
}

export function setVersion(
  dnps: DnpsInterface,
  name: string,
  version: string,
  value: Dependencies
): void {
  if (!dnps[name]) dnps[name] = { versions: {} };
  dnps[name].versions[version] = value;
}

export function getVersionsFromDnp(
  dnp: DnpInterface
): {
  [version: string]: {
    [dependencyName: string]: string;
  };
} {
  return dnp.versions;
}

export function toReq(name: string, version: string): string {
  return [name || "no-name", version || "no-version"].join("@");
}
