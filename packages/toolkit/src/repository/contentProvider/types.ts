/**
 * Mirror provider types for HTTP-based content distribution
 */

/**
 * Mirror API response for directory listing
 *
 * The mirror provides file metadata but not individual file CIDs.
 * This is acceptable because the package CID itself is verified via signature.json,
 * and since IPFS CIDs are content-addressed, verifying the package CID inherently
 * verifies all files within it.
 */
export interface MirrorListEntry {
  name: string;
  type: "file" | "directory";
  size: number;
  mtime: string;
}

/**
 * Result type for mirror fetch operations
 * Using discriminated union for type safety
 */
export type MirrorFetchResult =
  | { status: "success"; bytes: Uint8Array; urlHost: string }
  | { status: "failed"; reason: string };

/**
 * Options for download operations
 */
export interface FetchOptions {
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

/**
 * Mirror provider interface
 * Provides HTTP-based alternative to IPFS for content retrieval
 */
export interface MirrorProvider {
  /**
   * List contents of a directory by CID
   * @param cid - Content identifier (IPFS hash)
   * @returns Array of entries in the directory
   */
  list(cid: string): Promise<MirrorListEntry[]>;

  /**
   * Fetch a specific file from a directory
   * @param cid - Content identifier (directory CID)
   * @param filename - Name of file to fetch
   * @param options - Optional fetch options (abort signal, progress callback)
   * @returns Result with bytes or failure reason
   */
  fetchFile(cid: string, filename: string, options?: FetchOptions): Promise<MirrorFetchResult>;

  /**
   * Fetch content by CID directly (legacy support)
   * @param cid - Content identifier
   * @param options - Optional fetch options
   * @returns Result with bytes or failure reason
   */
  fetchByCid(cid: string, options?: FetchOptions): Promise<MirrorFetchResult>;
}
