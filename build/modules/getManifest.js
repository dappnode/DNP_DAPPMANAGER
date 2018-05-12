// node modules
const validator = require('validator')
const fs = require('fs')

// dedicated modules
const params = require('../params')
const apm = require('./calls/apm')
const ipfsCalls = require('./calls/ipfsCalls')
const emitter = require('./emitter')

const CACHE_DIR = params.CACHE_DIR

// console.log('dnpManifest: ',dnpManifest)
// >> eth domain of the package
// || call APM with an eth name + call IPFS and cat the hash
// << JSON object with the dnp_manifest
// ERRORS:
//   - Package name does not exist in the repo
//   - Package exists but version does not exist
//   - IPFS node not working
//   - IPFS cat takes too much

module.exports = async function getManifest(packageReq) {

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR)
    }
    if (fs.existsSync(CACHE_DIR + packageReq)) {
      // fs.fstatSync(fd)
      // stats.ctimeMs: 1318289051000.1 -> The timestamp indicating the last time the file status was changed expressed in milliseconds since the POSIX Epoch.
      // stats.ctime -> The timestamp indicating the last time the file status was changed.
      let data = fs.readFileSync(CACHE_DIR + packageReq);
      let dnpManifest = JSON.parse(data);
      return dnpManifest;
    }

    let packageObject = parsePackageReq(packageReq)
    var dnpHash = await apm.getRepoHash(packageObject.name, packageObject.ver)

    // Correct hash prefix
    if (dnpHash.includes('ipfs/')) {
      dnpHash = dnpHash.split('ipfs/')[1]
    }

    // cat the file and parse it
    let dnpManifest = JSON.parse( await ipfsCalls.cat(dnpHash) )

    return dnpManifest;
}

// Utilities

function parsePackageReq(req) {
  return {
    name: req.split('@')[0],
    ver: req.split('@')[1] || 'latest',
    req: req.split('@')[0] + '@' + (req[0].split('@')[1] || 'latest')
  }
}
