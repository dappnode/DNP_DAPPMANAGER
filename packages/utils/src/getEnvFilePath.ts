import path from "path";
import { getRepoDirPath } from "./getRepoDirPath.js";

export function getEnvFilePath(dnpName: string, isCore: boolean): string {
  return path.join(getRepoDirPath(dnpName, isCore), `${dnpName}.env`);
}
