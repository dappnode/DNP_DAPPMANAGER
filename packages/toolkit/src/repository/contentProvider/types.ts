/**
 * Content provider types for the HTTP mirror provider.
 *
 * The mirror serves DAppNode package files at:
 *   GET {baseUrl}/{packageCID}/{filename}
 *
 * Directory listings (no individual file CIDs):
 *   GET {baseUrl}/{packageCID}/
 */

export type MirrorFetchResult =
  | { status: "success"; bytes: Uint8Array }
  | { status: "failed"; reason: string };

export type MirrorStreamResult =
  | { status: "success" }
  | { status: "failed"; reason: string };

export interface FetchOptions {
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

export interface MirrorFileEntry {
  name: string;
  size: number;
}

export interface MirrorProvider {
  /** List files in a package directory (no individual file CIDs) */
  listFiles(cid: string): Promise<MirrorFileEntry[]>;
  /** Fetch a file into memory (for small files like manifests) */
  fetchFile(cid: string, filename: string, options?: FetchOptions): Promise<MirrorFetchResult>;
  /** Stream a file directly to disk (for large files like Docker images — avoids OOM) */
  fetchFileToPath(cid: string, filename: string, destPath: string, options?: FetchOptions): Promise<MirrorStreamResult>;
  /** Build the public URL for a file without downloading it (e.g. avatar URLs served to the browser) */
  getFileUrl(cid: string, filename: string): string;
}
