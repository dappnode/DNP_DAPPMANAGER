import { DnpsInterface, DnpInterface } from "../types";

export function getVersion(dnps: DnpsInterface, name: string, version: string) {
  return ((dnps[name] || {}).versions || {})[version];
}

export function hasVersion(dnps: DnpsInterface, name: string, version: string) {
  return Boolean(getVersion(dnps, name, version));
}

export function getDependencies(
  dnps: DnpsInterface,
  name: string,
  version: string
) {
  return getVersion(dnps, name, version);
}

export function setVersion(
  dnps: DnpsInterface,
  name: string,
  version: string,
  value: any
) {
  if (!dnps[name]) dnps[name] = { versions: {} };
  dnps[name].versions[version] = value;
}

export function getVersionsFromDnp(dnp: DnpInterface) {
  return dnp.versions;
}

export function toReq(name: string, version: string) {
  return [name || "no-name", version || "no-version"].join("@");
}
