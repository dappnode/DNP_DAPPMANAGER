import semver from "semver";

export function sanitizeVersion(version: string) {
  const sanitizedVersion = semver.clean(version, {
    loose: true
  });
  if (!sanitizedVersion)
    throw Error(`Error: ${version} cannot be used by semver`);
  return sanitizedVersion;
}
