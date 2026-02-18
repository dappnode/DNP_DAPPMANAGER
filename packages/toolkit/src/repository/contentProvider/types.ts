/**
 * Content provider types for mirror downloads
 */

export type MirrorFetchResult =
  | { status: "success"; bytes: Uint8Array }
  | { status: "failed"; reason: string };

export interface FetchOptions {
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

export interface MirrorProvider {
  fetchFile(cid: string, filename: string, options?: FetchOptions): Promise<MirrorFetchResult>;
}
