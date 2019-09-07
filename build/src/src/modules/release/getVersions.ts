import semver from "semver";
import fetchLatestVersionFromApm from "./apm/fetchLatestVersion";
import fetchVersion from "./apm/fetchVersion";
import fetchAllVersions from "./apm/fetchAllVersions";
import { ApmVersion } from "../../types";

export async function getLatestVersion(dnpName: string): Promise<ApmVersion> {
  return await fetchLatestVersionFromApm(dnpName);
}

export async function getVersion(
  dnpName: string,
  version: string
): Promise<ApmVersion> {
  const cleanVersion = semver.valid(version) ? semver.clean(version) : null;
  if (cleanVersion) return await fetchVersion(dnpName, cleanVersion);
  else return await getLatestVersion(dnpName);
}

export async function getAllVersions(
  dnpName: string,
  options?: { versionRange: string }
): Promise<ApmVersion[]> {
  const verReq = options && options.versionRange ? options.versionRange : "*";
  return await fetchAllVersions(dnpName, verReq);
}
