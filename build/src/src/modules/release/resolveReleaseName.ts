import { getVersion } from "./getVersions";
import isIpfsHash from "../../utils/isIpfsHash";
import isEnsDomain from "../../utils/isEnsDomain";
import isSemverRange from "../../utils/isSemverRange";
import isSemver from "../../utils/isSemver";

export default async function resolveReleaseName(
  name: string,
  version = "*"
): Promise<{
  hash: string;
  origin: string | null;
}> {
  // Correct version
  if (version === "latest") version = "*";

  // Normal case, name = eth domain & ver = semverVersion
  if (isEnsDomain(name) && isSemver(version))
    return {
      hash: await resolveApmVersion(name, version),
      origin: null
    };

  // Normal case, name = eth domain & ver = semverRange, [DO-NOT-CACHE] as the version is dynamic
  if (isEnsDomain(name) && isSemverRange(version))
    return {
      hash: await resolveApmVersion(name, version),
      origin: null
    };

  // IPFS normal case, name = eth domain & ver = IPFS hash
  if (isEnsDomain(name) && isIpfsHash(version))
    return {
      hash: version,
      origin: version
    };

  // When requesting IPFS hashes for the first time, their name is unknown
  // name = IPFS hash, ver = null
  if (isIpfsHash(name))
    return {
      hash: name,
      origin: name
    };

  // All other cases are invalid
  if (isEnsDomain(name))
    throw Error(`Invalid version, must be a semver or a hash: ${version}`);
  else throw Error(`Invalid DNP name, must be a ENS domain: ${name}`);
}

/**
 * Fetches the manifest hash
 *
 * @param {string} name
 * @param {string} ver
 * @returns {string} manifestHash
 */
async function resolveApmVersion(
  name: string,
  version: string
): Promise<string> {
  const res = await getVersion(name, version);
  return res.contentUri;
}
