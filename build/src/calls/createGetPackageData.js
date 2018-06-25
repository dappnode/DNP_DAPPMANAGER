const base64Img = require('base64-img');
const dockerListDefault = require('../modules/dockerList');
const parse = require('../utils/parse');
const res = require('../utils/res');
const ethchain = require('../watchers/ethchain');

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
  return async function getPackageData({args}) {
    const packageReq = parse.packageReq(args[0]);

    // Make sure the chain is synced
    if (await ethchain.isSyncing()) {
      return res.success('Mainnet is syncing', []);
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
        console.log('(createGetPackageData.js line 49) Could not fetch avatar of '+packageReq.name+' at '+avatarHash);
      }
    }

    return res.success('Got data of '+packageReq.name, {
      manifest,
      avatar,
    });
  };
}


module.exports = createGetPackageData;
