import downloadManifest from "./ipfs/downloadManifest";
import { getVersion } from "./getVersions";
import isIpfsHash from "../../utils/isIpfsHash";
import isEnsDomain from "../../utils/isEnsDomain";
import isSemverRange from "../../utils/isSemverRange";
import isSemver from "../../utils/isSemver";
import { PackageRequest, Manifest } from "../../types";

// Used by
// calls / fetchDirectory;
// calls / fetchPackageData;
// calls / installPackage;
// dappGet / getPkgDeps;

/**
 * Resolves the package request to the APM and fetches the manifest from IPFS.
 * It recognizes different types of requests:
 * - {name: kovan.dnp.dappnode.eth, ver: 0.1.0}
 * - {name: kovan.dnp.dappnode.eth, ver: 'ipfs/QmUHFxFbYdJDueBWzYZnvpzkjwBmMt3bmNDLQBTZzY18UZ'}
 * - {name: 'ipfs/QmUHFxFbYdJDueBWzYZnvpzkjwBmMt3bmNDLQBTZzY18UZ', ver: ''}
 *
 * @param {object} packageReq package request
 * @param {object} options package request
 * @returns {object} parsed manifest
 */
export default async function getManifest({
  name,
  ver
}: PackageRequest): Promise<Manifest> {
  if (ver === "latest") ver = "*";
  // Assert kwargs
  if (!name) throw Error(`getManifest kwargs must contain property "name"`);
  if (!ver) throw Error(`getManifest kwargs must contain property "ver"`);

  // 1. Get manifest hash
  const hash = await fetchManifestHash({ name, ver });

  // 2. Download the manifest
  // wrap in try / catch to format error
  const manifest = await downloadManifest(hash).catch(e => {
    throw Error(`Can't download ${name} manifest: ${e.message}`);
  });

  // Verify that the request was correct: hash mismatch
  // Except if the id is = "/ipfs/Qm...", there is no provided name
  if (isIpfsHash(name)) {
    ver = name;
    name = manifest.name;
  }
  if (name !== manifest.name)
    throw Error("DNP's name doesn't match the manifest's name");
  // Correct manifest: type missing
  if (!manifest.type) manifest.type = "library";

  return {
    ...manifest,
    // origin is critical for dappGet/aggregate on IPFS DNPs
    // used in packages.download > generate.dockerCompose
    origin: isSemverRange(ver) ? null : ver || name
  };
}

// Utilities

/**
 * Handles different request formats and fetches the manifest hash if necessary
 *
 * @param {string} name
 * @param {string} ver
 * @returns {object} = { hash, origin }
 */
async function fetchManifestHash({
  name,
  ver
}: PackageRequest): Promise<string> {
  // Normal case, name = eth domain & ver = semverVersion
  if (isEnsDomain(name) && isSemver(ver))
    return await resolveApmVersion({ name, ver });

  // Normal case, name = eth domain & ver = semverRange, [DO-NOT-CACHE] as the version is dynamic
  if (isEnsDomain(name) && isSemverRange(ver))
    return await resolveApmVersion({ name, ver });

  // IPFS normal case, name = eth domain & ver = IPFS hash
  if (isEnsDomain(name) && isIpfsHash(ver)) return ver;

  // When requesting IPFS hashes for the first time, their name is unknown
  // name = IPFS hash, ver = null
  if (isIpfsHash(name)) return name;

  // All other cases are invalid
  if (isEnsDomain(name))
    throw Error(`Invalid version, must be a semver or IPFS hash: ${ver}`);
  else throw Error(`Invalid DNP name, must be a ENS domain: ${name}`);
}

/**
 * Fetches the manifest hash
 *
 * @param {string} name
 * @param {string} ver
 * @returns {string} manifestHash
 */
async function resolveApmVersion({
  name,
  ver
}: PackageRequest): Promise<string> {
  const res = await getVersion(name, ver);
  return res.contentUri;
}
