import fs from "fs";
import pathUtil from "path";
import semver from "semver";
import { PackageRequest } from "../types";
import isIPFS from "is-ipfs";
import { logs } from "../logs";

const supportedDomains = ["eth"];

export function isEnsDomain(ensDomain: string): boolean {
  if (!ensDomain || typeof ensDomain !== "string") return false;
  if (ensDomain.includes("/")) return false;
  if (!ensDomain.includes(".")) return false;
  // "kovan.dnp.dappnode.eth" => "eth"
  const domain = ensDomain.split(".").slice(-1)[0] || "";
  if (!supportedDomains.includes(domain)) return false;
  // If any negative condition was matched:
  return true;
}

/**
 * Checks if the given string is a valid IPFS CID or path
 *
 * isIPFS.cid('QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o') // true (CIDv0)
 * isIPFS.cid('zdj7WWeQ43G6JJvLWQWZpyHuAMq6uYWRjkBXFad11vE2LHhQ7') // true (CIDv1)
 * isIPFS.cid('noop') // false
 *
 * @param hash
 * @returns
 */
export function isIpfsHash(hash: string): boolean {
  if (!hash || typeof hash !== "string") return false;
  // Correct hash prefix

  // Remove `ipfs/` or `/ipfs/` prefix
  hash = hash.split("ipfs/")[1] || hash;
  // Remove trailing and leading slashes
  hash = hash.replace(/\/+$/, "").replace(/^\/+/, "");
  // Ignore any subpath after the hash
  hash = hash.split("/")[0];

  // Make sure hash if valid
  return isIPFS.cid(hash);
}

export function isIpfsRequest(req: PackageRequest): boolean {
  if (req && typeof req === "object") {
    return Boolean(
      (req.name && isIpfsHash(req.name)) || (req.ver && isIpfsHash(req.ver))
    );
  } else if (req && typeof req === "string") {
    return isIpfsHash(req);
  } else {
    return false;
  }
}

/**
 * Must accept regular semvers and "*"
 * @param version
 */
export function isSemver(version: string): boolean {
  return Boolean(semver.valid(version));
}

/**
 * Must accept regular semvers and "*"
 * @param version
 */
export function isSemverRange(version: string): boolean {
  return Boolean(semver.validRange(version));
}

export function path(filePath: string): string {
  // shell.mkdir('-p', fullPath);
  // directory exists
  const parentPath = pathUtil.parse(filePath).dir;
  if (!fs.existsSync(parentPath)) {
    logs.warn(`Parent path doesn't exist, creating it: ${parentPath}`);
    fs.mkdirSync(parentPath, { recursive: true });
  }

  // returning so it can be used as
  // > await fs.writeFileSync(validate.path(path), data)
  return filePath;
}
