import fs from "fs";
import * as getPath from "../../utils/getPath";
import * as validate from "../../utils/validate";
import { Manifest } from "../../types";
import { isNotFoundError } from "../../utils/node";

/**
 * Improve error reporting, know what type of parsing is failing.
 * Without this error renaming, it's very hard to debug parsing errors
 */
function parseManifest(manifestString: string): Manifest {
  try {
    return JSON.parse(manifestString);
  } catch (e) {
    throw Error(`Error parsing manifest json: ${e.message}`);
  }
}

export function readManifestIfExists({
  name,
  isCore
}: {
  name: string;
  isCore: boolean;
}): Manifest | null {
  const manifestPath = validate.path(getPath.manifest(name, isCore));
  try {
    return parseManifest(fs.readFileSync(manifestPath, "utf8"));
  } catch (e) {
    if (!isNotFoundError(e)) throw e;
    return null;
  }
}
