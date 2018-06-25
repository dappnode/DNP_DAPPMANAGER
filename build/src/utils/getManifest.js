const validate = require('./validate');

function createGetManifest(apm, ipfsCalls) {
  return async function getManifest(packageReq) {
    // Expects a package request object
    // returns and manifest object
    validate.packageReq(packageReq);

    let dnpHash;
    if (packageReq.name.endsWith('.eth')) {
      dnpHash = await apm.getRepoHash(packageReq);

    // if the name of the package is already an IFPS hash, skip:
    } else if (packageReq.name.startsWith('/ipfs/Qm')) {
      dnpHash = packageReq.name;
    } else {
      throw Error('Unkown package request: '+packageReq.name);
    }


    // cat the file and parse it
    return JSON.parse( await ipfsCalls.cat(dnpHash) );
  };
}


module.exports = createGetManifest;
