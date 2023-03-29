import { Manifest } from "@dappnode/dappnodesdk/dist/exports";

export function getIsCore(manifest: Manifest): boolean {
  return manifest.type === "dncore";
}
