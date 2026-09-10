import { expect } from "chai";
import { Request, Response } from "express";
import { releaseFiles } from "@dappnode/types";
import { AvatarCache, createIpfsAvatarHandler } from "../../../src/api/avatar.js";

const CID_V0 = "QmYwAPJzv5CZsnAzt8auVZRnGiRAAW8h7B3S3GonqfM8E7";

describe("AvatarCache", () => {
  it("deduplicates concurrent requests for the same CID", async () => {
    const cache = new AvatarCache();
    let loads = 0;
    const load = async (): Promise<Uint8Array> => {
      loads++;
      await Promise.resolve();
      return Uint8Array.from([1, 2, 3]);
    };

    const [first, second] = await Promise.all([cache.get(CID_V0, load), cache.get(CID_V0, load)]);

    expect(loads).to.equal(1);
    expect(first).to.equal(second);
  });

  it("evicts the least recently used bytes", async () => {
    const cache = new AvatarCache(4);
    let bLoads = 0;
    await cache.get("a", async () => Uint8Array.from([1, 1]));
    await cache.get("b", async () => {
      bLoads++;
      return Uint8Array.from([2, 2]);
    });
    await cache.get("a", async () => Uint8Array.from([1, 1]));
    await cache.get("c", async () => Uint8Array.from([3, 3]));
    await cache.get("b", async () => {
      bLoads++;
      return Uint8Array.from([2, 2]);
    });

    expect(bLoads).to.equal(2);
  });
});

describe("createIpfsAvatarHandler", () => {
  it("validates the CID and serves immutable PNG bytes within the avatar limit", async () => {
    let requestedCid = "";
    let requestedMaxBytes = 0;
    const handler = createIpfsAvatarHandler(async (cid, maxBytes) => {
      requestedCid = cid;
      requestedMaxBytes = maxBytes;
      return Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
    });
    const { response, state } = mockResponse();

    await handler({ params: { cid: CID_V0 } } as Request<{ cid: string }>, response, () => undefined);

    expect(requestedCid).to.equal(CID_V0);
    expect(requestedMaxBytes).to.equal(releaseFiles.avatar.maxSize);
    expect(state.headers["Content-Type"]).to.equal("image/png");
    expect(state.headers["Cache-Control"]).to.equal("public, max-age=31536000, immutable");
    expect(Buffer.isBuffer(state.body)).to.equal(true);
  });

  it("rejects invalid CIDs without calling a gateway", async () => {
    let called = false;
    const handler = createIpfsAvatarHandler(async () => {
      called = true;
      return new Uint8Array();
    });
    const { response, state } = mockResponse();

    await handler({ params: { cid: "not-a-cid" } } as Request<{ cid: string }>, response, () => undefined);

    expect(called).to.equal(false);
    expect(state.statusCode).to.equal(400);
  });

  it("rejects CID content that is not a PNG", async () => {
    const handler = createIpfsAvatarHandler(async () => Uint8Array.from([1, 2, 3]));
    const { response, state } = mockResponse();

    await handler({ params: { cid: CID_V0 } } as Request<{ cid: string }>, response, () => undefined);

    expect(state.statusCode).to.equal(502);
  });
});

function mockResponse(): {
  response: Response;
  state: { statusCode: number; headers: Record<string, string>; body?: unknown };
} {
  const state: { statusCode: number; headers: Record<string, string>; body?: unknown } = {
    statusCode: 200,
    headers: {}
  };
  const response = {
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    set(headers: Record<string, string>) {
      state.headers = { ...state.headers, ...headers };
      return this;
    },
    send(body: unknown) {
      state.body = body;
      return this;
    }
  } as Response;
  return { response, state };
}
