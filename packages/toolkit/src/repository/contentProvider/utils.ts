/**
 * Normalizes an IPFS CID by removing any "/ipfs/" prefix and trailing slashes.
 * Examples:
 *   "/ipfs/QmFoo" → "QmFoo"
 *   "QmFoo/"      → "QmFoo"
 *   "QmFoo"       → "QmFoo"
 */
export function normalizeCid(cid: string): string {
  return cid.replace(/^\/ipfs\//, "").replace(/\/+$/, "");
}

/**
 * Rounds download progress to the nearest `resolution` percent to avoid
 * excessive progress callbacks.
 *
 * @param received - Bytes received so far.
 * @param total    - Total bytes expected.
 * @param resolution - Rounding step (default 1%).
 * @returns Rounded progress in [0, 100].
 */
export function roundProgress(received: number, total: number, resolution = 1): number {
  if (total === 0) return 0;
  const raw = (received / total) * 100;
  return Math.min(100, resolution * Math.round(raw / resolution));
}
