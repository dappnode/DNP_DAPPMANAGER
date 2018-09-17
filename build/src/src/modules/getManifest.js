const validate = require('utils/validate');
const ipfs = require('modules/ipfs');
const apm = require('modules/apm');

/**
 * Resolves the package request to the APM and fetches the manifest from IPFS.
 * @param {object} packageReq package request
 * @param {object} options package request
 * @return {object} parsed manifest
 */
async function getManifest(packageReq, options = {}) {
  validate.packageReq(packageReq);
  let fromIpfs;
  let verified;
  let isCore;
  if (packageReq.hash && packageReq.hash.startsWith('/ipfs/')) {
    fromIpfs = packageReq.hash.replace('/ipfs/', 'ipfs-');
  } else if (packageReq.name.endsWith('.eth')) {
    if (packageReq.ver.startsWith('/ipfs/')) {
      // packageReq.hash = 'ipfs/QmUHFxFbYdJDueBWzYZnvpzkjwBmMt3bmNDLQBTZzY18UZ';
      packageReq.hash = packageReq.ver;
      fromIpfs = packageReq.ver.replace('/ipfs/', 'ipfs-');
    } else {
      packageReq.hash = await apm.getRepoHash(packageReq);
      verified = packageReq.name.endsWith('.dnp.dappnode.eth');
    }
  // if the name of the package is already an IFPS hash, skip:
  } else if (packageReq.name.startsWith('/ipfs/')) {
    packageReq.hash = packageReq.name;
    fromIpfs = packageReq.name.replace('/ipfs/', 'ipfs-');
  } else {
    throw Error('Unkown package request: '+packageReq.name);
  }


  // cat the file and parse it
  const manifest = JSON.parse( await ipfs.cat(packageReq.hash) );

  // Verify that the request was correct
  if (packageReq.name && packageReq.name.endsWith('.eth')
  && manifest && manifest.name
  && packageReq.name !== manifest.name) {
    throw Error('Package name requested doesn\'t match its manifest');
  }

  // Allow core only if the package is verified
  if (manifest.type == 'dncore') {
    if (options.BYPASS_CORE_RESTRICTION || verified) {
      isCore = true;
    } else {
      // inform the user of improper usage
      throw Error('Unverified CORE package request');
    }
  }

  return {
    ...manifest,
    isCore,
    fromIpfs,
  };
}


module.exports = getManifest;
