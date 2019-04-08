const getDirectory = require("modules/getDirectory");
const { eventBus, eventBusTag } = require("eventBus");
const logs = require("logs.js")(module);
const getManifest = require("modules/getManifest");
const getAvatar = require("modules/getAvatar");
const parse = require("utils/parse");
const isSyncing = require("utils/isSyncing");

let packagesCache;
let avatarCache = {};

function emitPkg(pkg) {
  const pkgsObj = {
    [pkg.name]: pkg
  };
  eventBus.emit(eventBusTag.emitDirectory, pkgsObj);
}

// function emitPkgs(pkgs) {
//   const pkgsObj = {};
//   for (const pkg of pkgs) {
//     pkgsObj[pkg.name] = pkg;
//   }
//   eventBus.emit(eventBusTag.emitDirectory, pkgsObj);
// }

/**
 * Fetches all package names in the custom dappnode directory.
 * This feature helps the ADMIN UI load the directory data faster.
 *
 * @param {Object} kwargs: {}
 * @return {Object} A formated success message.
 * result: packages =
 *   [
 *     {
 *       name: packageName, (string)
 *       status: 'Preparing', (string)
 *       currentVersion: '0.1.2' or null, (String)
 *     },
 *     ...
 *   ]
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

  // List of available packages in the directory
  // Return an array of objects:
  //   [
  //     {
  //       name: packageName,  (string)
  //       status: 'Preparing' (string)
  //     },
  //     ...
  //   ]
  const packages = await getDirectory();

  // Extend package object contents
  packagesCache = await Promise.all(
    packages.map(async pkg => {
      const { name } = pkg;
      emitPkg(pkg);

      // Now resolve the last version of the package
      const manifest = await getManifest(parse.packageReq(name));
      // Correct manifest
      if (!manifest.type) manifest.type = "library";
      emitPkg({ name, manifest });

      // Fetch the package image
      const avatarHash = manifest.avatar;

      let avatar;
      if (avatarHash) {
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
          // If the avatar can not be fetched don't crash
          logs.error(
            "Could not fetch avatar of " +
              name +
              " at " +
              avatarHash +
              ": " +
              e.message
          );
        }
      }

      // Merge results and return
      return {
        ...pkg,
        manifest,
        avatar
      };
    })
  );

  const payloadSize = Math.floor(
    Buffer.byteLength(JSON.stringify(packagesCache), "utf8") / 1000
  );
  return {
    message: `Listed directory with ${
      packagesCache.length
    } packages (${payloadSize} KB)`,
    result: packagesCache,
    logMessage: true
  };
};

module.exports = fetchDirectory;
