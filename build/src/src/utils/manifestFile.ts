import fs from "fs";
import { Manifest } from "../types";

export function readManifest(manfiestPath: string): Manifest {
  return JSON.parse(fs.readFileSync(manfiestPath, "utf8"));
}

export function writeManifest(manfiestPath: string, manifest: Manifest): void {
  fs.writeFileSync(manfiestPath, JSON.stringify(manifest, null, 2));
}
