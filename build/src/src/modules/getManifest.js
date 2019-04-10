const validate = require("utils/validate");
const ipfs = require("modules/ipfs");
const apm = require("modules/apm");

// Used by
// calls / fetchDirectory;
// calls / fetchPackageData;
// calls / fetchPackageVersions;
// calls / installPackage;
// dappGet / getPkgDeps;

/**
 * Resolves the package request to the APM and fetches the manifest from IPFS.
 * It recognizes different types of requests:
 * - {name: kovan.dnp.dappnode.eth, ver: 0.1.0}
 * - {name: kovan.dnp.dappnode.eth, ver: 'ipfs/QmUHFxFbYdJDueBWzYZnvpzkjwBmMt3bmNDLQBTZzY18UZ'}
 * - {name: 'ipfs/QmUHFxFbYdJDueBWzYZnvpzkjwBmMt3bmNDLQBTZzY18UZ', ver: ''}
 *
 * @param {object} packageReq package request
 * @param {object} options package request
 * @return {object} parsed manifest
 */
async function getManifest(packageReq) {
  validate.packageReq(packageReq);

  let fromIpfs;

  if ((packageReq.hash || "").startsWith("/ipfs/")) {
    fromIpfs = packageReq.hash.replace("/ipfs/", "ipfs-");
  } else if (packageReq.name.endsWith(".eth")) {
    if (packageReq.ver.startsWith("/ipfs/")) {
      // packageReq.hash = 'ipfs/QmUHFxFbYdJDueBWzYZnvpzkjwBmMt3bmNDLQBTZzY18UZ';
      packageReq.hash = packageReq.ver;
      fromIpfs = packageReq.ver.replace("/ipfs/", "ipfs-");
    } else {
      packageReq.hash = await apm.getRepoHash(packageReq);
    }
    // if the name of the package is already an IFPS hash, skip:
  } else if (packageReq.name.startsWith("/ipfs/")) {
    packageReq.hash = packageReq.name;
    fromIpfs = packageReq.name.replace("/ipfs/", "ipfs-");
  } else {
    throw Error(`Unkown package request name: ${packageReq.name}`);
  }

  // cat the file and parse it
  // pass a maxSize = 100KB option which will throw an error if that size is exceeded
  const manifestUnparsed = await ipfs.cat(packageReq.hash, { maxSize: 100000 });
  let manifest;
  try {
    manifest = JSON.parse(manifestUnparsed);
  } catch (e) {
    throw Error(`Error JSON parsing the manifest: ${e.message}`);
  }

  // Verify the manifest
  if (!manifest.image || typeof manifest.image !== "object") {
    throw Error(
      `Invalid manifest: it does not contain the expected property 'image'`
    );
  }
  if (!manifest.image.hash) {
    throw Error(
      `Invalid manifest: it does not contain the expected property 'image.hash'`
    );
  }

  // Verify that the request was correct
  if (
    packageReq.name &&
    packageReq.name.endsWith(".eth") &&
    manifest &&
    manifest.name &&
    packageReq.name !== manifest.name
  ) {
    throw Error("Package name requested doesn't match its manifest");
  }

  return {
    ...manifest,
    fromIpfs
  };
}

module.exports = getManifest;
