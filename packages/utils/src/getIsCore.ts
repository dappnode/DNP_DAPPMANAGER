import { Manifest } from "@dappnode/common";

export function getIsCore(manifest: Manifest): boolean {
  return manifest.type === "dncore";
}
