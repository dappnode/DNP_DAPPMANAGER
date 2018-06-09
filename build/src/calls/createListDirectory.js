const semver = require('semver')
const fs = require('fs')
const base64Img = require('base64-img')
const dockerList_default = require('../modules/dockerList')
const parse = require('../utils/parse')
const res =   require('../utils/res')
const ethchain = require('../watchers/ethchain')

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

    // Make sure the chain is synced
    if(await ethchain.isSyncing()) {
      return res.success("Mainnet is syncing", [])
    }

    // List of available packages in the directory
    const packages = await getDirectory()
    // List of current packages locally
    const dnpList = await dockerList.listContainers()

    // Extend package object contents
    for (const pkg of packages) {

      let manifest
      try {
        manifest = await getManifest(parse.packageReq(pkg.name))
      } catch(e) {
        console.log('(createListDirectory.js line 47) Could not fetch manifest of '+pkg.name)
      }

      // If the manifest was successfully fetched
      if (manifest) {
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

          // If the avatar can not be fetched don't crash
          try {
            await ipfsCalls.cat(avatarHash)
            pkg.avatarHash = avatarHash
            pkg.avatar = base64Img.base64Sync('cache/'+avatarHash)

          } catch(e) {
            console.log('(createListDirectory.js line 67) Could not fetch avatar of '+pkg.name+' at '+avatarHash)
          }

        }
      }
    }

    return res.success("Listed directory with " + packages.length + " packages", packages)

  }
}


function getTag(v_now, v_avail) {
  // If there is no current version, display install
  if (!v_now) return 'Install'
  // Prevent the function from crashing
  if (!semver.valid(v_now)) return 'Install (unk v_now='+v_now+')'
  if (!semver.valid(v_avail)) return 'Install (unk v_avail='+v_avail+')'
  // Compare versions and return appropiate tag
  if (semver.lt(v_now, v_avail)) return 'Update'
  else return 'Installed'
}



module.exports = createListDirectory
