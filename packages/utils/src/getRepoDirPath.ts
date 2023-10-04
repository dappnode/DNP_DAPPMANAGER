import path from "path";
import { params } from "@dappnode/params";

export function getRepoDirPath(dnpName: string, isCore: boolean): string {
  if (isCore) return params.DNCORE_DIR;
  return path.join(params.REPO_DIR, dnpName);
}
