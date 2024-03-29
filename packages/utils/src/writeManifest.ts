import fs from "fs";
import { Manifest } from "@dappnode/types";

export function writeManifest(manfiestPath: string, manifest: Manifest): void {
  fs.writeFileSync(manfiestPath, JSON.stringify(manifest, null, 2));
}
