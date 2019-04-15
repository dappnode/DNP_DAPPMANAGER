const getDirectory = require("modules/getDirectory");
const { eventBus, eventBusTag } = require("eventBus");
const logs = require("logs.js")(module);
const getManifest = require("modules/getManifest");
const getAvatar = require("modules/getAvatar");
const parse = require("utils/parse");
const isSyncing = require("utils/isSyncing");
const isIpfsHash = require("utils/isIpfsHash");

let packagesCache;
let avatarCache = {};

/**
 * Emits a DNP object to the UI for a progressive update response.
 * The first argument of `emitDirectory` must be an array of DNP objects
 * @param {object} pkg
 */
function emitPkg(pkg) {
  eventBus.emit(eventBusTag.emitDirectory, [pkg]);
}

/**
 * Fetches all package names in the custom dappnode directory.
 * This feature helps the UI to load the directory data faster.
 *
 * @returns {array} A formated success message.
 * result: packages = [{
 *   name: "bitcoin.dnp.dappnode.eth", {string}
 *   status: "preparing", {string}
 *   manifest: <manifest object>, {object}
 *   avatar: <base64 image>, {string}
 * }, ... ]
 */
const fetchDirectory = async () => {
  if (await isSyncing()) {
    return {
      message: `Mainnet is still syncing`,
      result: [],
      logMessage: true
    };
  }

  // Emit a cached version right away
  if (packagesCache && Array.isArray(packagesCache)) {
    // Send packages one by one. This should help on extremely slow connections
    packagesCache.forEach(emitPkg);
  }

  /**
   * List of available packages in the directory
   * @param {array} dnpsFromDirectory = [{
   *   name: "bitcoin.dnp.dappnode.eth", {string}
   *   status: "preparing", {string}
   * }, ... ]
   */
  const dnpsFromDirectory = await getDirectory();

  // Extend package object contents
  packagesCache = await Promise.all(
    dnpsFromDirectory.map(async ({ name, status }) => {
      // Now resolve the last version of the package
      const manifest = await getManifest(parse.packageReq(name));
      emitPkg({ name, status, manifest });

      // Fetch the package image
      const avatarHash = manifest.avatar;

      let avatar;
      if (isIpfsHash(avatarHash)) {
        try {
          // Retrieve cached avatar or fetch it
          if (avatarCache[avatarHash]) {
            avatar = avatarCache[avatarHash];
          } else {
            avatar = await getAvatar(avatarHash);
            avatarCache[avatarHash] = avatar;
          }
          emitPkg({ name, avatar });
        } catch (e) {
          // If the avatar can not be fetched don't stop the function
          logs.error(
            `Error fetching avatar of ${name} at ${avatarHash}: ${e.message}`
          );
        }
      }

      // Merge results and return
      return {
        name,
        status,
        manifest,
        avatar
      };
    })
  );

  const payloadSize = Math.floor(
    Buffer.byteLength(JSON.stringify(packagesCache), "utf8") / 1000
  );
  return {
    message: `Listed directory: ${
      packagesCache.length
    } DNPs, ${payloadSize} KB`,
    result: packagesCache,
    logMessage: true
  };
};

module.exports = fetchDirectory;
