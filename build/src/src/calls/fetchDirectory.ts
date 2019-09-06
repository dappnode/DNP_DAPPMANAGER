import getDirectory from "../modules/getDirectory";
import { eventBus, eventBusTag } from "../eventBus";
import getManifest from "../modules/getManifest";
import getAvatar from "../modules/getAvatar";
import * as parse from "../utils/parse";
import isSyncing from "../utils/isSyncing";
import isIpfsHash from "../utils/isIpfsHash";
import { DirectoryDnp, RpcHandlerReturn } from "../types";
import Logs from "../logs";
const logs = Logs(module);

interface RpcFetchDirectoryReturn extends RpcHandlerReturn {
  result: DirectoryDnp[];
}

let dnpsCache: DirectoryDnp[] = [];
const avatarCache: { [avatarHash: string]: string } = {};

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
export default async function fetchDirectory(): Promise<
  RpcFetchDirectoryReturn
> {
  if (Boolean(await isSyncing())) {
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
    dnpsFromDirectory.map(async pkg => {
      const name = pkg.name;
      // Now resolve the last version of the package
      const manifest = await getManifest(parse.packageReq(name));
      emitPkg({
        ...pkg,
        name,
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
          emitPkg({ ...pkg, name, avatar });
        } catch (e) {
          // If the avatar can not be fetched don't stop the function
          logs.error(
            `Error fetching avatar of ${name} at ${avatarHash}: ${e.message}`
          );
        }
      }

      // Merge results and return
      return {
        ...pkg,
        name,
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
}

// Utils / Cache managment

/**
 * Emits a DNP object to the UI for a progressive update response.
 * The first argument of `emitDirectory` must be an array of DNP objects
 *
 * - Emit the dnp only if the cache has changed. Prevent too much UI re-renders
 * @param {object} dnp
 */
function emitPkg(dnp: DirectoryDnp): void {
  const dnpCache = dnpsCache.find(({ name }) => name === dnp.name);
  if (!dnpCache || isCacheInvalid(dnpCache, dnp))
    eventBus.emit(eventBusTag.emitDirectory, [dnp]);
}

function isCacheInvalid(dnpCache: DirectoryDnp, dnpNew: DirectoryDnp): boolean {
  const manifestNew = dnpNew ? dnpNew.manifest : null;
  const versionNew = manifestNew ? manifestNew.version : null;
  const versionCache =
    dnpCache && dnpCache.manifest ? dnpCache.manifest.version : null;
  const avatarNew = dnpNew ? dnpNew.avatar : null;
  const avatarCache = dnpCache ? dnpCache.avatar : null;
  /**
   * Only two elements can change, the manifest and the avatar
   * - Since these DNPs are fetched from an APM, there will never be two
   *   different manifest for the same version
   * - The avatar is a raw string, so it can be compared with a simple equality
   */
  if (manifestNew && !versionNew) return true;
  if (manifestNew && versionNew !== versionCache) return true;
  if (avatarNew && avatarNew !== avatarCache) return true;
  return false;
}
