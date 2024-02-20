import path from "path";
import { getRepoDirPath } from "./getRepoDirPath.js";

export function getManifestPath(dnpName: string, isCore: boolean): string {
  return path.join(
    getRepoDirPath(dnpName, isCore),
    getManifestName(dnpName, isCore)
  );
}

function getManifestName(dnpName: string, isCore: boolean): string {
  if (isCore) return `dappnode_package-${getShortName(dnpName)}.json`;
  else return "dappnode_package.json";
}

function getShortName(dnpName: string): string {
  verifyDnpName(dnpName);
  return ((dnpName || "").split(".")[0] || "").toLowerCase();
}

function verifyDnpName(dnpName: string): void {
  if (typeof dnpName !== "string")
    throw Error(
      `dnpName must be a string, but it's ${typeof dnpName}: ${JSON.stringify(
        dnpName
      )}`
    );
}
