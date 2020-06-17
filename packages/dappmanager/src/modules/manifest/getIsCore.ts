import { Manifest } from "../../types";

export function getIsCore(manifest: Manifest): boolean {
  return manifest.type === "dncore";
}
