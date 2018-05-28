const semver = require('semver')
const fs = require('fs')
const base64Img = require('base64-img')
const dockerList_default = require('../modules/dockerList')
const parse = require('../utils/parse')
const res =   require('../utils/res')

// CALL DOCUMENTATION:
// > result = packages =
//   [
//     {
//       name: packageName, (string)
//       status: 'Preparing', (string)
//       manifest: <Manifest>, (object)
//       tag: 'Instaled', (string)
//       avatar: <base64Img>, (string)
//       avatarHash: <IPFS hash> (string)
//     },
//     ...
//   ]

function createListDirectory(getDirectory,
  getManifest,
  ipfsCalls,
  dockerList=dockerList_default) {

  return async function listDirectory() {

    // List of available packages in the directory
    const packages = await getDirectory()
    // List of current packages locally
    const dnpList = await dockerList.listContainers()

    // Extend package object contents
    for (const pkg of packages) {
      const manifest = await getManifest(parse.packageReq(pkg.name))
      const latestVersion = manifest.version
      if (!latestVersion) throw Error('latestVersion is not defined')

      // Fetch the current package version
      const _package = dnpList.filter(c => c.name == pkg.name)[0]
      const currentVersion = _package ? _package.version : null

      // Store info in package object
      pkg.tag = getTag(currentVersion, latestVersion)
      pkg.disableInstall = (pkg.tag == 'Installed')
      pkg.manifest = manifest
      // console.trace('\x1b[33m%s\x1b[0m', pkg.name + 'currentVersion: '+currentVersion+' latestVersion: '+latestVersion+' ==> '+pkg.tag)

      // Fetch the package image
      const avatarHash = manifest.avatar
      if (avatarHash) {
        await ipfsCalls.cat(avatarHash)
        pkg.avatarHash = avatarHash
        pkg.avatar = base64Img.base64Sync('cache/'+avatarHash)
      }
    }

    return res.success("Listed directory with " + packages.length + " packages", packages)

  }
}


function getTag(v_now, v_avail) {
  if (!v_now) return 'Install'
  if (semver.lt(v_now, v_avail)) return 'Update'
  else return 'Installed'
}



module.exports = createListDirectory
