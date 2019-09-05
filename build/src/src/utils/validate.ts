const shell = require("shelljs");
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

export function isEthDomain(domain: string) {
  if (domain.substr(domain.length - 4) != ".eth") {
    logs.error(`Error: reponame is not an .eth domain: ${domain}`);
    throw Error(`reponame is not an .eth domain: ${domain}`);
  }
}

export function path(path: string) {
  // shell.mkdir('-p', fullPath);
  // directory exists
  const parentPath = path.replace(/\/[^/]+\/?$/, "");
  if (!shell.test("-e", parentPath)) {
    logs.warn(
      `Parent path doesn't exist, creating it. pwd: ${shell.pwd()}, parent: ${parentPath}`
    );
    shell.mkdir("-p", parentPath);
  }

  // returning so it can be used as
  // > await fs.writeFileSync(validate.path(path), data)
  return path;
}
