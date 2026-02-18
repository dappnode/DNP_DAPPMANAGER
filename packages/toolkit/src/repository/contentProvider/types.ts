export interface FetchByCidOptions {
  timeoutMs?: number;
  expectedSize?: number;
  progress?: (n: number) => void;
}

export type MirrorMapEntry = {
  url: string;
  sha256?: string;
  size?: number;
};

export type MirrorMapSchema = Record<string, string | MirrorMapEntry>;

export interface MirrorMapCache {
  getEntry(cid: string): Promise<MirrorMapEntry | null>;
}

export type MirrorAttemptResult =
  | {
      status: "miss";
    }
  | {
      status: "success";
      bytes: Uint8Array;
      urlHost: string;
    }
  | {
      status: "failed";
      reason: string;
      urlHost?: string;
    };

export interface MirrorProvider {
  fetchByCid(cid: string, options?: FetchByCidOptions): Promise<MirrorAttemptResult>;
}
