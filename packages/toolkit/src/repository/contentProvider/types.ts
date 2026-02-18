export interface FetchByCidOptions {
  timeoutMs?: number;
  expectedSize?: number;
  progress?: (n: number) => void;
}

export interface MirrorListEntry {
  name: string;
  type: "file" | "directory";
  size: number;
  mtime: string;
}

export type MirrorAttemptResult =
  | {
      status: "success";
      bytes: Uint8Array;
      url: string;
    }
  | {
      status: "failed";
      reason: string;
      url: string;
    };

export interface MirrorProvider {
  // List files in a directory (CID)
  list(cid: string): Promise<MirrorListEntry[]>;

  // Download a specific file from a directory
  fetchFile(cid: string, filename: string, options?: FetchByCidOptions): Promise<MirrorAttemptResult>;

  // Download by CID (for backward compatibility)
  fetchByCid(cid: string, options?: FetchByCidOptions): Promise<MirrorAttemptResult>;
}
