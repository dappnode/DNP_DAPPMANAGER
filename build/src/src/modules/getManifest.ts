import downloadManifest from "./downloadManifest";
import * as apm from "./apm";
import * as db from "../db";
import isIpfsHash from "../utils/isIpfsHash";
import isEnsDomain from "../utils/isEnsDomain";
import isSemverRange from "../utils/isSemverRange";
import isSemver from "../utils/isSemver";
import { RequestInterface, ManifestInterface } from "../types";
import Joi from "joi";

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
}: RequestInterface): Promise<ManifestInterface> {
  if (ver === "latest") ver = "*";
  // Assert kwargs
  if (!name) throw Error(`getManifest kwargs must contain property "name"`);
  if (!ver) throw Error(`getManifest kwargs must contain property "ver"`);

  // 1. Get manifest hash
  const hash = await fetchManifestHash({ name, ver });

  // 2. Download the manifest
  // wrap in try / catch to format error
  let manifest;
  try {
    manifest = await downloadManifest(hash);
  } catch (e) {
    e.message = `Can't download ${name} manifest: ${e.message}`;
    throw e;
  }

  // Verify the manifest
  validateManifest(manifest);
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
async function fetchManifestHash({ name, ver }: RequestInterface) {
  /**
   * 0. Normal case, name = eth domain & ver = semverVersion
   * Go fetch to the APM
   */
  if (isEnsDomain(name) && isSemver(ver)) {
    return await resolveApmVersionAndCache({ name, ver });
  }

  /**
   * 1. Normal case, name = eth domain & ver = semverRange
   * [DO-NOT-CACHE] as the version is dynamic
   * Go fetch to the APM
   */
  if (isEnsDomain(name) && isSemverRange(ver)) {
    return await resolveApmVersion({ name, ver });
  }

  /**
   * 2. IPFS normal case, name = eth domain & ver = IPFS hash
   */
  if (isEnsDomain(name) && isIpfsHash(ver)) {
    return ver;
  }

  /**
   * 3. When requesting IPFS hashes for the first time, their name is unknown
   *    name = IPFS hash, ver = null
   */
  if (isIpfsHash(name)) {
    return name;
  }

  /**
   * 3. All other cases are invalid
   */
  if (isEnsDomain(name))
    throw Error(`Invalid version, must be a semver or IPFS hash: ${ver}`);
  else throw Error(`Invalid DNP name, must be a ENS domain: ${name}`);
}

/**
 * Fetches the manifest hash and handles cache
 *
 * @param {string} name
 * @param {string} ver
 * @returns {string} manifestHash
 */
async function resolveApmVersionAndCache({ name, ver }: RequestInterface) {
  /**
   * Construct a key for the db. The semver CANNOT be 0.1.0 as that would mean {0: {1: {0: {}}}
   * id = goerli-pantheon-dnp-dappnode-eth-0-1-0
   */
  const key = `${name}-${ver}`.split(".").join("-");

  // Check if the key is stored in cache. This key-value will never change
  const hashCache: string = db.get(key);
  if (hashCache) return hashCache;

  const hash = await resolveApmVersion({ name, ver });
  db.set(key, hash);
  return hash;
}

/**
 * Fetches the manifest hash
 *
 * @param {string} name
 * @param {string} ver
 * @returns {string} manifestHash
 */
async function resolveApmVersion({ name, ver }: RequestInterface) {
  return await apm.getRepoHash({ name, ver });
}

function validateManifest(manifest: ManifestInterface) {
  // Minimal (very relaxed) manifest check
  const manifestSchema = Joi.object({
    name: Joi.string().required(),
    version: Joi.string().required(),
    image: Joi.object({
      hash: Joi.string().required()
    })
      .pattern(/./, Joi.any())
      .required()
  }).pattern(/./, Joi.any());

  // Throws error if invalid
  Joi.assert(manifest, manifestSchema, "Manifest");
}
