import { valid, gt } from "semver";

export function highestVersion(v1: string, v2: string): string {
  // If no version is passed return the other
  if (!v1 && v2) return v2;
  if (!v2 && v1) return v1;
  if (!v1 && !v2) throw Error("Comparing two undefined versions");

  // If any version is latest return latest
  if (v1 == "latest" || v2 == "latest") return "latest";

  // Compare semantic versions
  if (!valid(v1) || !valid(v2)) {
    throw new Error(
      `Attempting to compare invalid versions, version1: ${v1} version2: ${v2}`
    );
  }
  if (gt(v1, v2)) {
    return v1;
  } else {
    return v2;
  }
}
