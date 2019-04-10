const parse = require("utils/parse");
const apm = require("modules/apm");
const getManifest = require("modules/getManifest");
const isSyncing = require("utils/isSyncing");
const isIpfsRequest = require("utils/isIpfsRequest");

/**
 * Fetches all available version manifests from a package APM repo
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 * }
 * @return {Object} A formated success message.
 * result: packageWithVersions =
 *   [
 *     {
 *       version: '0.0.4', (string)
 *       manifest: <Manifest> (object)
 *     },
 *     ...
 *   ]
 */
const fetchPackageVersions = async ({ id }) => {
  if (!id) throw Error("kwarg id must be defined");

  const packageReq = parse.packageReq(id);

  if (!isIpfsRequest(packageReq) && (await isSyncing())) {
    return {
      message: `Mainnet is still syncing`,
      result: [],
      logMessage: true
    };
  }

  if (packageReq.name.endsWith(".eth")) {
    let packageVersions = await getPackageVersions(packageReq);

    await getManifestOfVersions(packageReq, packageVersions);

    return {
      message: `Fetched versions of: ${packageReq.name}`,
      result: packageVersions
    };

    // if the name of the package is already an IFPS hash, skip:
  } else if (packageReq.name.startsWith("/ipfs/Qm")) {
    const manifest = await getManifest(packageReq);
    return {
      message: `Fetched versions of: ${packageReq.name}`,
      result: [
        {
          version: manifest.version,
          manifest: manifest
        }
      ]
    };
  } else {
    throw Error(`Unkown package request: ${packageReq.name}`);
  }
};

// Utility methods
const getManifestOfVersions = async (packageReq, versions) => {
  await Promise.all(
    versions.map(async version => {
      try {
        version.manifest = await getManifest({
          name: packageReq.name,
          ver: version.version
        });
      } catch (e) {
        version.manifest = { error: true, message: e.message, stack: e.stack };
      }
    })
  );
};

// Reverse to have newer versions on top
const getPackageVersions = async packageReq => {
  const versionsObj = await apm.getRepoVersions(packageReq);
  return Object.keys(versionsObj).map(version => ({
    version,
    manifestHash: versionsObj[version]
  }));
};

if (process.env.TEST) {
  module.exports = {
    getPackageVersions,
    getManifestOfVersions,
    fetchPackageVersions
  };
} else {
  module.exports = fetchPackageVersions;
}
