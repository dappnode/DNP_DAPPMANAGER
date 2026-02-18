/**
 * Utility functions for content provider operations
 */

/**
 * Normalize a CID by removing IPFS prefixes and slashes
 */
export function normalizeCid(cid: string): string {
  let normalized = cid.split("ipfs/")[1] || cid;

  while (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  while (normalized.startsWith("/")) {
    normalized = normalized.slice(1);
  }

  return normalized.split("/")[0];
}

/**
 * Round progress percentage to avoid excessive callbacks
 */
export function roundProgress(current: number, total: number, resolution = 1): number {
  if (total === 0) return 0;
  const percentage = (current / total) * 100;
  const rounded = resolution * Math.round(percentage / resolution);
  return Math.min(rounded, 100);
}
