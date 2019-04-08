const parse = require("utils/parse");
const logs = require("logs.js")(module);
const getManifest = require("modules/getManifest");
const getAvatar = require("modules/getAvatar");
// const isSyncing = require('utils/isSyncing');
// const isIpfsRequest = require('utils/isIpfsRequest');

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
const fetchPackageData = async ({ id }) => {
  if (!id) throw Error("kwarg id must be defined");

  const packageReq = parse.packageReq(id);

  // Make sure the chain is synced
  // if (!isIpfsRequest(packageReq) && await isSyncing()) {
  //   return {
  //     message: `Mainnet is still syncing`,
  //     result: {},
  //     logMessage: true,
  //   };
  // }

  const manifest = await getManifest(packageReq);

  // Correct manifest
  if (!manifest.type) manifest.type = "library";

  // Fetch the package image
  const avatarHash = manifest.avatar;
  let avatar;
  if (avatarHash) {
    try {
      avatar = await getAvatar(avatarHash);
    } catch (e) {
      // If the avatar can not be fetched don't crash
      logs.error(
        `Error fetching avatar of ${packageReq.name} at ${avatarHash}: ${
          e.message
        }`
      );
    }
  }

  return {
    message: "Got data of " + packageReq.name,
    result: {
      manifest,
      avatar
    }
  };
};

module.exports = fetchPackageData;
