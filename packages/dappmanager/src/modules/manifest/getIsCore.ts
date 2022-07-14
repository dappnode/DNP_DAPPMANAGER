import { Manifest } from "@dappnode/dappnodesdk";

export function getIsCore(manifest: Manifest): boolean {
  return manifest.type === "dncore";
}
