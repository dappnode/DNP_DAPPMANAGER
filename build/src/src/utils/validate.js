const shell = require("shelljs");
const logs = require("logs.js")(module);

/*
 * Multipurpose util, it will check for a condition and correct it or throw an error.
 * It valides:
 * - packageReq: Standard object in multiple RPCs
 * - ethDomain: Ensures *.eth
 * - IPFShash
 * - path: Extensively used. It verifies that a path exists, otherwise creates its
 *         parent directory recursively with mkdir -p
 */

function packageReq(packageReq) {
  if (!packageReq) throw Error("VALIDATION ERROR: packageReq is undefined");

  if (typeof packageReq != "object") {
    throw Error(
      "VALIDATION ERROR: packageReq is not an object, packageReq: " +
        JSON.stringify(packageReq)
    );
  }

  if (!packageReq.hasOwnProperty("name")) {
    throw Error(
      "VALIDATION ERROR: packageReq has no [name] key, packageReq: " +
        JSON.stringify(packageReq)
    );
  }

  if (!packageReq.hasOwnProperty("ver")) {
    throw Error(
      "VALIDATION ERROR: packageReq has no [ver] key, packageReq: " +
        JSON.stringify(packageReq)
    );
  }
}

function isEthDomain(domain) {
  if (!domain) throw Error("VALIDATION ERROR: domain is undefined");

  if (typeof domain != "string") {
    throw Error(`VALIDATION ERROR: domain must be a string: ${domain}`);
  }

  if (domain.substr(domain.length - 4) != ".eth") {
    logs.error(`Error: reponame is not an .eth domain: ${domain}`);
    throw Error(`reponame is not an .eth domain: ${domain}`);
  }
}

function isIPFShash(hash) {
  if (!hash || typeof hash !== "string")
    throw Error("VALIDATION ERROR: hash is undefined");

  return (
    (hash.startsWith("/ipfs/Qm") ||
      hash.startsWith("ipfs/Qm") ||
      hash.startsWith("Qm")) &&
    !hash.endsWith(".eth")
  );
}

function web3Existance(_web3) {
  if (!_web3) throw Error("VALIDATION ERROR: web3 is not defined");
}

function path(path) {
  if (!path) throw Error(`VALIDATION ERROR: path is not defined: ${path}`);
  if (typeof path != "string")
    throw Error(`VALIDATION ERROR: path must be a string ${path}`);

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

module.exports = {
  packageReq,
  isEthDomain,
  web3Existance,
  isIPFShash,
  path
};
