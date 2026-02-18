/**
 * Utility functions for content provider operations
 */

/**
 * Normalize a CID by removing IPFS prefixes and slashes
 *
 * Examples:
 * - "/ipfs/QmXXX" → "QmXXX"
 * - "ipfs/QmXXX" → "QmXXX"
 * - "QmXXX/" → "QmXXX"
 * - "QmXXX" → "QmXXX"
 *
 * @param cid - CID string potentially with prefixes
 * @returns Normalized CID string
 */
export function normalizeCid(cid: string): string {
  // Remove /ipfs/ or ipfs/ prefix
  let normalized = cid.split("ipfs/")[1] || cid;

  // Remove trailing and leading slashes
  normalized = normalized.replace(/\/+$/, "").replace(/^\/+/, "");

  // Return only the CID part (ignore any subpath)
  return normalized.split("/")[0];
}

/**
 * Round progress percentage to avoid excessive update callbacks
 *
 * @param current - Current number of bytes downloaded
 * @param total - Total number of bytes to download
 * @param resolution - Resolution for rounding (default: 1 = round to nearest percent)
 * @returns Rounded progress percentage (0-100)
 */
export function roundProgress(current: number, total: number, resolution = 1): number {
  if (total === 0) return 0;

  const percentage = (current / total) * 100;
  const rounded = resolution * Math.round(percentage / resolution);

  // Ensure we don't exceed 100%
  return Math.min(rounded, 100);
}
