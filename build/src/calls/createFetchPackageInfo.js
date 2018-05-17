const parse = require('../utils/parse')
const res =   require('../utils/res')

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

function createFetchPackageInfo(getManifest, apm) {

  const getManifestOfVersions = createGetManifestOfVersions(getManifest)
  const getPackageVersions = createGetPackageVersions(apm)

  return async function fetchPackageInfo(req) {

    const packageReq = parse.packageReq(req[0])
    let packageWithVersions = await getPackageVersions(packageReq)

    await getManifestOfVersions(packageReq, packageWithVersions.versions)

    return res.success("Fetched info of: " + packageReq.name, packageWithVersions)

  }
}


///////////////////////////////
// Helper functions


function createGetManifestOfVersions(getManifest) {

  return async function getManifestOfVersions(packageReq, versions) {

    let manifests = await Promise.all(
      versions.map( async (version) => {
        try {
          version.manifest = await getManifest({
            name: packageReq.name,
            ver: version.version
          })
        } catch(e) {
          version.manifest = {error: true, message: e.message, stack: e.stack}
        }
      })
    )
  }
}


function createGetPackageVersions(apm) {

  return async function getPackageVersions(packageReq) {
    return {
      name: packageReq.name,
      versions: ( await apm.getRepoVersions(packageReq) ).reverse()
    }
  }
}



module.exports = {
  createFetchPackageInfo,
  createGetManifestOfVersions,
  createGetPackageVersions
}
