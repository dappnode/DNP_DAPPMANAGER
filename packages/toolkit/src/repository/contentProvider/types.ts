/**
 * Content provider types for mirror downloads
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

export interface MirrorProvider {
  /** Fetch file into memory (for small files like manifests) */
  fetchFile(cid: string, filename: string, options?: FetchOptions): Promise<MirrorFetchResult>;
  /** Stream file directly to disk (for large files like Docker images) */
  fetchFileToPath(cid: string, filename: string, destPath: string, options?: FetchOptions): Promise<MirrorStreamResult>;
}
