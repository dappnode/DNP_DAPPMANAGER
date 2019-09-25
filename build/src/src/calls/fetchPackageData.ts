import { pick } from "lodash";
import getRelease from "../modules/release/getRelease";
import getAvatar from "../modules/release/getAvatar";
import Logs from "../logs";
import { RpcHandlerReturn, ManifestWithImage, PackageRelease } from "../types";
import { parseService } from "../utils/dockerComposeParsers";
const logs = Logs(module);

interface RpcFetchPackageDataReturn extends RpcHandlerReturn {
  result: {
    manifest: ManifestWithImage;
    avatar: string | null;
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

  const release = await getRelease(id);

  // Fetch the package image

  let avatar: string | null = null;
  if (release.avatarFile) {
    const avatarHash = release.avatarFile.hash;
    try {
      avatar = await getAvatar(avatarHash);
    } catch (e) {
      // If the avatar can not be fetched don't crash
      logs.error(
        `Error fetching avatar of ${id} at ${avatarHash}: ${e.message}`
      );
    }
  }

  const legacyManifest = getLegacyManifestFromRelease(release);

  return {
    message: `Got data of ${id}`,
    result: {
      manifest: legacyManifest,
      avatar: avatar
    }
  };
}

export function getLegacyManifestFromRelease({
  compose,
  imageFile,
  metadata
}: PackageRelease): ManifestWithImage {
  const service = parseService(compose);
  return {
    ...metadata,
    image: {
      hash: imageFile.hash,
      size: imageFile.size,
      path: "legacy-path",
      ...pick(service, ["ports", "volumes", "environment"])
    }
  };
}
