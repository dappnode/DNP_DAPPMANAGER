const parse = require('utils/parse');
const paramsDefault = require('params');

// CALL DOCUMENTATION:
// > kwargs: id
// > result: packageWithVersions =
//   [
//     {
//        version: '0.0.4', (string)
//        manifest: <Manifest> (object)
//     }
//   ]


/**
 * TODO: documentation.
 * @param {function} getManifest - Dependency.
 * @param {function} apm - Dependency.
 * @return {number} A formated success message.
 */
function createFetchPackageVersions({
  getManifest,
  apm,
  params = paramsDefault,
}) {
  // Declare utility methods
  const getManifestOfVersions = async (packageReq, versions) => {
    await Promise.all(
      versions.map( async (version) => {
        try {
          version.manifest = await getManifest({
            name: packageReq.name,
            ver: version.version,
          });
        } catch (e) {
          version.manifest = {error: true, message: e.message, stack: e.stack};
        }
      })
    );
  };

  const getPackageVersions = async (packageReq) =>
  // Reverse to have newer versions on top
    ( await apm.getRepoVersions(packageReq) ).reverse();

  // Declare methods
  const fetchPackageVersions = async ({
    id,
  }) => {
    const packageReq = parse.packageReq(id);

    if (packageReq.name.endsWith('.eth')) {
      let packageVersions = await getPackageVersions(packageReq);

      await getManifestOfVersions(packageReq, packageVersions);

      return {
        message: 'Fetched versions of: ' + packageReq.name,
        result: packageVersions,
      };

    // if the name of the package is already an IFPS hash, skip:
    } else if (packageReq.name.startsWith('/ipfs/Qm')) {
      const manifest = await getManifest(packageReq);
      return {
        message: 'Fetched versions of: ' + packageReq.name,
        result: [
          {
            version: manifest.version,
            manifest: manifest,
          },
        ],
      };
    } else {
      throw Error('Unkown package request: '+packageReq.name);
    }
  };

  // Expose auxiliary methods for testing
  if (params.testing) {
    return {
        getManifestOfVersions,
        getPackageVersions,
        fetchPackageVersions,
    };
  // Expose main methods for production
  } else {
      return fetchPackageVersions;
  }
}

module.exports = createFetchPackageVersions;
