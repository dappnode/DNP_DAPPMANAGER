const base64Img = require('base64-img');
const dockerListDefault = require('../modules/dockerList');
const parse = require('../utils/parse');
const ethchain = require('../watchers/ethchain');
const logs = require('../logs.js')(module);

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

function createGetPackageData(
  getManifest,
  ipfsCalls,
  dockerList=dockerListDefault) {
  return async function getPackageData({id}) {
    const packageReq = parse.packageReq(id);

    // Make sure the chain is synced
    if (await ethchain.isSyncing()) {
      return {
        message: 'Mainnet is syncing',
        result: [],
      };
    }

    const manifest = await getManifest(parse.packageReq(packageReq.name));

    // Correct manifest
    if (!manifest.type) manifest.type = 'library';

    // Fetch the package image
    const avatarHash = manifest.avatar;
    let avatar;
    if (avatarHash) {
      // If the avatar can not be fetched don't crash
      try {
        await ipfsCalls.cat(avatarHash);
        avatar = base64Img.base64Sync('cache/'+avatarHash);
      } catch (e) {
        logs.error('Could not fetch avatar of '+packageReq.name+' at '+avatarHash);
      }
    }

    return {
      message: 'Got data of '+packageReq.name,
      result: {
        manifest,
        avatar,
      },
    };
  };
}


module.exports = createGetPackageData;
