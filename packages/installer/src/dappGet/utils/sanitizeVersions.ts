/**
 * WARNING: versions is an external uncontrolled input, verify
 * @param versions
 */
export function sanitizeVersions(versions: string[]): string[] {
  if (!versions) {
    throw Error("SANITIZE-ERROR: Versions is not defined");
  }
  if (!Array.isArray(versions)) {
    throw Error(`SANITIZE-ERROR: Versions is not an array. versions: ${JSON.stringify(versions)}`);
  }
  return versions;
}
