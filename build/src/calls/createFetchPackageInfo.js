const parse = require('../utils/parse');
const res = require('../utils/res');

// CALL DOCUMENTATION:
// > result = packageWithVersions =
//   {
//     name: packageName, (string)
//     versions: [
//       {
//         version: '0.0.4', (string)
//         manifest: <Manifest> (object)
//       }
//     ]
//   }


/**
 * Get the x value.
 * @param {function} getManifest - Dependency.
 * @param {function} apm - Dependency.
 * @return {number} A formated success message.
 */
function createFetchPackageInfo(getManifest, apm) {
  const getManifestOfVersions = createGetManifestOfVersions(getManifest);
  const getPackageVersions = createGetPackageVersions(apm);

  return async function fetchPackageInfo({id}) {
    const packageReq = parse.packageReq(id);

    if (packageReq.name.endsWith('.eth')) {
      let packageWithVersions = await getPackageVersions(packageReq);

      await getManifestOfVersions(packageReq, packageWithVersions.versions);

      return res.success('Fetched info of: ' + packageReq.name, packageWithVersions);


    // if the name of the package is already an IFPS hash, skip:
    } else if (packageReq.name.startsWith('/ipfs/Qm')) {
      const manifest = await getManifest(packageReq);
      return res.success('Fetched info of: ' + packageReq.name, {
        name: manifest.name,
        versions: [
          {
            version: manifest.version,
            manifest: manifest,
          },
        ],
      });
    } else {
      throw Error('Unkown package request: '+packageReq.name);
    }
  };
}


// /////////////////////////////
// Helper functions


function createGetManifestOfVersions(getManifest) {
  return async function getManifestOfVersions(packageReq, versions) {
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
}


function createGetPackageVersions(apm) {
  return async function getPackageVersions(packageReq) {
    return {
      name: packageReq.name,
      versions: ( await apm.getRepoVersions(packageReq) ).reverse(),
    };
  };
}


module.exports = {
  createFetchPackageInfo,
  createGetManifestOfVersions,
  createGetPackageVersions,
};
