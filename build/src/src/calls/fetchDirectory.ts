import getDirectory from "../modules/release/getDirectory";
import * as eventBus from "../eventBus";
import getRelease from "../modules/release/getRelease";
import getAvatar from "../modules/release/getAvatar";
import isSyncing from "../utils/isSyncing";
import { isIpfsHash } from "../utils/validate";
import { DirectoryDnp, RpcHandlerReturn } from "../types";
import Logs from "../logs";
import { getLegacyManifestFromRelease } from "./fetchPackageData";
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
    eventBus.directory.emit(dnpsCache);
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
  const dnpsCacheTemp: (DirectoryDnp | undefined)[] = await Promise.all(
    dnpsFromDirectory.map(async pkg => {
      try {
        const name = pkg.name;
        // Now resolve the last version of the package
        const release = await getRelease(name);
        const legacyManifest = getLegacyManifestFromRelease(release);
        emitPkg({ ...pkg, name, manifest: legacyManifest });

        // Fetch the package avatar
        const avatarFile = release.avatarFile;
        let avatar;
        if (avatarFile && isIpfsHash(avatarFile.hash)) {
          const avatarHash = avatarFile.hash;
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
          manifest: legacyManifest,
          avatar
        };
      } catch (e) {
        logs.error(`Error fetching ${name} release: ${e.message}`);
      }
    })
  );

  // Make sure the order is correct
  dnpsCache = [];
  for (const dnp of dnpsCacheTemp) if (dnp) dnpsCache.push(dnp);

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
    eventBus.directory.emit([dnp]);
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
