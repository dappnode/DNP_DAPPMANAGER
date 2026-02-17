import {
  FetchByCidOptions,
  FetchByCidResult,
  IpfsProvider,
  MirrorProvider,
  OnContentProviderEvent
} from "./types.js";
import { normalizeCid } from "./utils.js";

export class CidContentProviderResolver {
  private readonly ipfsProvider: IpfsProvider;
  private readonly mirrorProvider?: MirrorProvider;

  constructor({
    ipfsProvider,
    mirrorProvider
  }: {
    ipfsProvider: IpfsProvider;
    mirrorProvider?: MirrorProvider;
  }) {
    this.ipfsProvider = ipfsProvider;
    this.mirrorProvider = mirrorProvider;
  }

  public async fetchByCid(
    cid: string,
    options?: FetchByCidOptions & { onContentProviderEvent?: OnContentProviderEvent }
  ): Promise<FetchByCidResult> {
    const normalizedCid = normalizeCid(cid);
    const onContentProviderEvent = options?.onContentProviderEvent;

    if (this.mirrorProvider) {
      const mirrorResult = await this.mirrorProvider.fetchByCid(normalizedCid, options);

      if (mirrorResult.status === "success") {
        onContentProviderEvent?.({
          provider: "mirror",
          status: "success",
          cid: normalizedCid,
          urlHost: mirrorResult.urlHost
        });
        return {
          provider: "mirror",
          bytes: mirrorResult.bytes
        };
      }

      if (mirrorResult.status === "failed") {
        onContentProviderEvent?.({
          provider: "mirror",
          status: "failed",
          cid: normalizedCid,
          reason: mirrorResult.reason,
          urlHost: mirrorResult.urlHost
        });

        const ipfsResult = await this.ipfsProvider.fetchByCid(normalizedCid, options);
        onContentProviderEvent?.({
          provider: "ipfs",
          status: "success",
          cid: normalizedCid,
          reason: "mirror-failed"
        });
        return ipfsResult;
      }

      const ipfsResult = await this.ipfsProvider.fetchByCid(normalizedCid, options);
      onContentProviderEvent?.({
        provider: "ipfs",
        status: "success",
        cid: normalizedCid,
        reason: "mirror-miss"
      });
      return ipfsResult;
    }

    const ipfsResult = await this.ipfsProvider.fetchByCid(normalizedCid, options);
    onContentProviderEvent?.({
      provider: "ipfs",
      status: "success",
      cid: normalizedCid,
      reason: "ipfs-only"
    });
    return ipfsResult;
  }
}
