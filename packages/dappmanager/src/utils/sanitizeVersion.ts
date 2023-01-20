import { clean } from "semver";

/**
 * Return a version with low level of constraints that can be used by semver
 * Or throw an error if cannot be cleaned
 */
export function sanitizeVersion(version: string): string {
  const sanitizedVersion = clean(version, {
    loose: true
  });
  if (!sanitizedVersion)
    throw Error(`Error: ${version} cannot be used by semver`);
  return sanitizedVersion;
}

/**
 * A compose version has format `major.minor` (i.e. `3.5`) which is not valid semver.
 * This function returns a valid semver by setting `patch = 0`, allowing to compare with semver fns,
 * i.e. `semver.gt()`
 */
export function parseComposeSemver(composeVersion: string): string {
  return sanitizeVersion(composeVersion + ".0");
}
