export interface FetchByCidOptions {
  timeoutMs?: number;
  expectedSize?: number;
  progress?: (n: number) => void;
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
  fetchByCid(cid: string, options?: FetchByCidOptions): Promise<MirrorAttemptResult>;
}
