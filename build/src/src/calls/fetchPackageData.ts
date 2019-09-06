import * as parse from "../utils/parse";
import getManifest from "../modules/getManifest";
import getAvatar from "../modules/getAvatar";
import Logs from "../logs";
import { Manifest, RpcHandlerReturn } from "../types";
const logs = Logs(module);

interface RpcFetchPackageDataReturn extends RpcHandlerReturn {
  result: {
    manifest: Manifest;
    avatar: string | undefined;
  };
}

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
export default async function fetchPackageData({
  id
}: {
  id: string;
}): Promise<RpcFetchPackageDataReturn> {
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
}
