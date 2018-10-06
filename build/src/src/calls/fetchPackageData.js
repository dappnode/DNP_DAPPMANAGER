const base64Img = require('base64-img');
const parse = require('utils/parse');
const logs = require('logs.js')(module);
const params = require('params');
const ipfs = require('modules/ipfs');
const getManifest = require('modules/getManifest');
const isSyncing = require('utils/isSyncing');

/**
 * Fetches the manifest of the latest version and its avatar.
 * This feature helps the ADMIN UI load the directory data faster.
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 * }
 * @return {Object} A formated success message.
 * result: packageData =
 *   {
 *     avatar, (string)
 *     manifest, (object)
 *   },
 */
const fetchPackageData = async ({
  id,
}) => {
  if (await isSyncing()) {
    throw Error('Mainnet is syncing');
  }

  const packageReq = parse.packageReq(id);

  // Make sure the chain is synced
  // if (await ethchain.isSyncing()) {
  //   return res.success('Mainnet is syncing', []);
  // }

  const manifest = await getManifest(packageReq);

  // Correct manifest
  if (!manifest.type) manifest.type = 'library';

  // Fetch the package image
  const avatarHash = manifest.avatar;
  let avatar;
  if (avatarHash) {
    try {
      await ipfs.cat(avatarHash);
      avatar = base64Img.base64Sync(params.CACHE_DIR + avatarHash);
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


module.exports = fetchPackageData;
