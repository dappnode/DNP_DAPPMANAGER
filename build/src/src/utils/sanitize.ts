const defaultVersion = "*";

/**
 * Strips a possible version appended to the name
 */
export function sanitizeRequestName(name: string): string {
  name = name.split("@")[0];
  return name;
}

export function sanitizeRequestVersion(version?: string): string {
  if (!version) return defaultVersion;
  return version;
}
