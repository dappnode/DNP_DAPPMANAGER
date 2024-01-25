import fs from "fs";
import { Manifest } from "@dappnode/types";
import { getManifestPath } from "./getManifestPath.js";
import { isNotFoundError } from "./isNotFoundError.js";
import { validatePath } from "./validatePath.js";
import { yamlParse } from "./yaml.js";

/**
 * Improve error reporting, know what type of parsing is failing.
 * Without this error renaming, it's very hard to debug parsing errors
 */
function parseManifest(manifestString: string): Manifest {
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
