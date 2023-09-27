import path from "path";
import fs from "fs";
import { getRepoDirPath } from "./getRepoDirPath.js";

export function getDockerComposePath(dnpName: string, isCore: boolean): string {
  return path.join(
    getRepoDirPath(dnpName, isCore),
    getDockerComposeName(dnpName, isCore)
  );
}

export function getDockerComposePathSmart(dnpName: string): string {
  // First check for core docker-compose
  const DOCKERCOMPOSE_PATH = getDockerComposePath(dnpName, true);
  if (fs.existsSync(DOCKERCOMPOSE_PATH)) return DOCKERCOMPOSE_PATH;
  // Then check for dnp docker-compose
  return getDockerComposePath(dnpName, false);
}

function getDockerComposeName(dnpName: string, isCore: boolean): string {
  if (isCore) return `docker-compose-${getShortName(dnpName)}.yml`;
  else return "docker-compose.yml";
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
