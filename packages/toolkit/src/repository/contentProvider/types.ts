export type ContentProviderEvent =
  | {
      provider: "mirror";
      status: "success";
      cid: string;
      urlHost: string;
    }
  | {
      provider: "mirror";
      status: "failed";
      cid: string;
      reason: string;
      urlHost?: string;
    }
  | {
      provider: "ipfs";
      status: "success";
      cid: string;
      reason: "mirror-miss" | "mirror-failed" | "ipfs-only";
    };

export type OnContentProviderEvent = (event: ContentProviderEvent) => void;

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
