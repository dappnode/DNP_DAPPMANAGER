import { Manifest } from "@dappnode/dappnodesdk/src/files/manifest";

export function getIsCore(manifest: Manifest): boolean {
  return manifest.type === "dncore";
}
