import path from "path";
import { getRepoDirPath } from "./getRepoDirPath.js";

export function getImagePath(dnpName: string, version: string, isCore: boolean): string {
  return path.join(getRepoDirPath(dnpName, isCore), `${dnpName}_${version}.tar.xz`);
}
