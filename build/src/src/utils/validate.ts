import fs from "fs";
import pathUtil from "path";
import Logs from "../logs";
const logs = Logs(module);

/*
 * Multipurpose util, it will check for a condition and correct it or throw an error.
 * It valides:
 * - packageReq: Standard object in multiple RPCs
 * - ethDomain: Ensures *.eth
 * - IPFShash
 * - path: Extensively used. It verifies that a path exists, otherwise creates its
 *         parent directory recursively with mkdir -p
 */

export function isEthDomain(domain: string): void {
  if (domain.substr(domain.length - 4) != ".eth") {
    logs.error(`Error: reponame is not an .eth domain: ${domain}`);
    throw Error(`reponame is not an .eth domain: ${domain}`);
  }
}

export function path(filePath: string): string {
  // shell.mkdir('-p', fullPath);
  // directory exists
  const parentPath = pathUtil.parse(filePath).dir;
  if (!fs.existsSync(parentPath)) {
    logs.warn(`Parent path doesn't exist, creating it: ${parentPath}`);
    fs.mkdirSync(parentPath, { recursive: true });
  }

  // returning so it can be used as
  // > await fs.writeFileSync(validate.path(path), data)
  return filePath;
}
