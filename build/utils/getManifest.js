const validate = require('./validate')

function createGetManifest(apm, ipfsCalls) {

  return async function getManifest(packageReq) {

    validate.packageReq(packageReq)
    var dnpHash = await apm.getRepoHash(packageReq)

    // Correct hash prefix
    if (dnpHash.includes('ipfs/')) {
      dnpHash = dnpHash.split('ipfs/')[1]
    }

    // cat the file and parse it
    return JSON.parse( await ipfsCalls.cat(dnpHash) )
  }
}


module.exports = createGetManifest
