import { valid, validRange } from "semver";

export function isEnsDomain(ensDomain: string): boolean {
  const supportedDomains = ["eth"];

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
 * Must accept regular semvers and "*"
 * @param version
 */
export function isSemver(version: string): boolean {
  return Boolean(valid(version));
}

/**
 * Must accept regular semvers and "*"
 * @param version
 */
export function isSemverRange(version: string): boolean {
  return Boolean(validRange(version));
}
