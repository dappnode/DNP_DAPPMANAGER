const base64Img = require('base64-img');
const parse = require('utils/parse');
const logs = require('logs.js')(module);
const paramsDefault = require('params');
const ipfsDefault = require('modules/ipfs');

// CALL DOCUMENTATION:
// > kwargs: id
// > result: packageData =
//   {
//     avatar,
//     manifest,
//   }

function createFetchPackageData({
  getManifest,
  ipfs = ipfsDefault,
  params = paramsDefault,
}) {
  // Declare parameters for method to have access to
  const CACHE_DIR = params.CACHE_DIR;

  // Return main method
  const fetchPackageData = async ({
    id,
  }) => {
    const packageReq = parse.packageReq(id);

    // Make sure the chain is synced
    // if (await ethchain.isSyncing()) {
    //   return res.success('Mainnet is syncing', []);
    // }

    const manifest = await getManifest(parse.packageReq(packageReq.name));

    // Correct manifest
    if (!manifest.type) manifest.type = 'library';

    // Fetch the package image
    const avatarHash = manifest.avatar;
    let avatar;
    if (avatarHash) {
      try {
        await ipfs.cat(avatarHash);
        avatar = base64Img.base64Sync(CACHE_DIR + avatarHash);
      } catch (e) {
        // If the avatar can not be fetched don't crash
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

  // Expose main method
  return fetchPackageData;
}


module.exports = createFetchPackageData;
