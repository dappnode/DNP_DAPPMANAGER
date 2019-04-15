const getDirectory = require("modules/getDirectory");
const { eventBus, eventBusTag } = require("eventBus");
const logs = require("logs.js")(module);
const getManifest = require("modules/getManifest");
const getAvatar = require("modules/getAvatar");
const parse = require("utils/parse");
const isSyncing = require("utils/isSyncing");
const isIpfsHash = require("utils/isIpfsHash");

let dnpsCache = [];
let avatarCache = {};

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

  // Emit the cached DNPs right away
  if (Array.isArray(dnpsCache) && dnpsCache.length) {
    eventBus.emit(eventBusTag.emitDirectory, dnpsCache);
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
  dnpsCache = await Promise.all(
    dnpsFromDirectory.map(async ({ name, status, directoryId }) => {
      // Now resolve the last version of the package
      const manifest = await getManifest(parse.packageReq(name));
      emitPkg({
        name,
        status,
        directoryId,
        manifest
      });

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
          emitPkg({
            name,
            avatar
          });
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
        directoryId,
        // Appended
        manifest,
        avatar
      };
    })
  );

  const payloadSize = Math.floor(
    Buffer.byteLength(JSON.stringify(dnpsCache), "utf8") / 1000
  );
  return {
    message: `Listed directory: ${dnpsCache.length} DNPs, ${payloadSize} KB`,
    result: dnpsCache,
    logMessage: true
  };
};

// Utils / Cache managment

/**
 * Emits a DNP object to the UI for a progressive update response.
 * The first argument of `emitDirectory` must be an array of DNP objects
 *
 * - Emit the dnp only if the cache has changed. Prevent too much UI re-renders
 * @param {object} dnp
 */
function emitPkg(dnp) {
  const dnpCache = dnpsCache.find(({ name }) => name === dnp.name);
  if (!dnpCache || isCacheInvalid(dnpCache, dnp))
    eventBus.emit(eventBusTag.emitDirectory, [dnp]);
}

function isCacheInvalid(dnpCache, dnpNew) {
  const manifestNew = (dnpNew || {}).manifest;
  const versionNew = (manifestNew || {}).version;
  const versionCache = ((dnpCache || {}).manifest || {}).version;
  const avatarNew = (dnpNew || {}).avatar;
  const avatarCache = (dnpCache || {}).avatar;
  /**
   * Only two elements can change, the manifest and the avatar
   * - Since these DNPs are fetched from an APM, there will never be two
   *   different manifest for the same version
   * - The avatar is a raw string, so it can be compared with a simple equality
   */
  if (manifestNew && !versionNew) return true;
  if (manifestNew && versionNew !== versionCache) return true;
  if (avatarNew && avatarNew !== avatarCache) return true;
}

module.exports = fetchDirectory;
