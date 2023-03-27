import { Manifest } from "@dappnode/dappnodesdk/types";

export function getIsCore(manifest: Manifest): boolean {
  return manifest.type === "dncore";
}
