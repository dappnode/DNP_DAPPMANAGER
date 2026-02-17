export function normalizeCid(value: string): string {
  let cid = value.trim();

  // "ipfs://<cid>/..." | "/ipfs/<cid>/..." | "ipfs/<cid>"
  cid = cid.replace(/^ipfs:\/\//i, "");
  cid = cid.replace(/^\/?ipfs\//i, "");
  cid = cid.replace(/^\/+/, "");

  // Trim optional subpaths.
  return cid.split("/")[0];
}

export function roundProgress(downloaded: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((downloaded / total) * 100);
}
