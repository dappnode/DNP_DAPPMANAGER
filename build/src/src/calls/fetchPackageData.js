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
 * @param {string} id DNP .eth name
 * @returns {object} result = {
 *   avatar: "data:image/png;base64..." {string},
 *   manifest: <manifest object> {object}
 * }
 */
const fetchPackageData = async ({ id }) => {
  if (!id) throw Error("kwarg id must be defined");

  const manifest = await getManifest(parse.packageReq(id));

  // Fetch the package image
  const avatarHash = manifest.avatar;
  let avatar;
  if (avatarHash) {
    try {
      avatar = await getAvatar(avatarHash);
    } catch (e) {
      // If the avatar can not be fetched don't crash
      logs.error(
        `Error fetching avatar of ${id} at ${avatarHash}: ${e.message}`
      );
    }
  }

  return {
    message: `Got data of ${id}`,
    result: {
      manifest,
      avatar
    }
  };
};

module.exports = fetchPackageData;
