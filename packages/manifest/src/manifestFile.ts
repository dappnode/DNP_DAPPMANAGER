import fs from "fs";
import { Manifest } from "@dappnode/common";
import {
  validatePath,
  yamlParse,
  isNotFoundError,
  getManifestPath,
} from "@dappnode/utils";

/**
 * Improve error reporting, know what type of parsing is failing.
 * Without this error renaming, it's very hard to debug parsing errors
 */
export function parseManifest(manifestString: string): Manifest {
  try {
    return yamlParse(manifestString);
  } catch (e) {
    throw Error(`Error parsing manifest json: ${e.message}`);
  }
}

function readManifest(manfiestPath: string): Manifest {
  return parseManifest(fs.readFileSync(manfiestPath, "utf8"));
}

export function readManifestIfExists({
  dnpName,
  isCore,
}: {
  dnpName: string;
  isCore: boolean;
}): Manifest | null {
  const manifestPath = validatePath(getManifestPath(dnpName, isCore));
  try {
    return readManifest(manifestPath);
  } catch (e) {
    if (!isNotFoundError(e)) throw e;
    return null;
  }
}

export function writeManifest(manfiestPath: string, manifest: Manifest): void {
  fs.writeFileSync(manfiestPath, JSON.stringify(manifest, null, 2));
}
