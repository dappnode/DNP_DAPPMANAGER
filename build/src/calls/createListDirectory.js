const dockerList_default = require('../modules/dockerList')
const parse = require('../utils/parse')
const semver = require('semver')
const fs = require('fs')


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
        pkg.tag = shouldInstall(currentVersion, latestVersion)
        console.trace('\x1b[33m%s\x1b[0m', pkg.name + 'currentVersion: '+currentVersion+' latestVersion: '+latestVersion+' ==> '+pkg.tag)

        // Fetch the package image
        const avatarHash = manifest.avatar
        if (avatarHash) {
          console.trace('\x1b[33m%s\x1b[0m', avatarHash)
          await ipfsCalls.cat(avatarHash)
          pkg.avatarHash = avatarHash
          pkg.avatar = base64Img.base64Sync('cache/'+avatarHash)
        }

      }

      return JSON.stringify({
          success: true,
          message: "Listing " + packages.length + " packages",
          result: packages
      })

  }

}


function shouldInstall(v_now, v_avail) {
  if (!v_now) return 'install'
  if (semver.lt(v_now, v_avail)) return 'update'
  else return 'installed'
}



module.exports = createListDirectory
