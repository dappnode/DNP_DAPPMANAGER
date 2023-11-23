import { valid, validRange } from "semver";

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
