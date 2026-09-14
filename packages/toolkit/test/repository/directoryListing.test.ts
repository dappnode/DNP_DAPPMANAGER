import { expect } from "chai";
import * as dagPb from "@ipld/dag-pb";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import { JsonRpcProvider } from "ethers";
import { DappnodeRepository } from "../../src/repository/repository.js";

// A UnixFS directory containing one file, served without gateway codec conversion.
const fileCid = CID.parse("QmdZ9EWDmx6SB2bxvk7BStVka6JkjzMzpun1TAuDvzhLp9");
const directoryBytes = dagPb.encode({
  Data: Uint8Array.from([8, 1]),
  Links: [{ Hash: fileCid, Name: "dappnode_package.json", Tsize: 123 }]
});

function repository(gateways: string[] = ["http://ipfs.dappnode:8080"]): DappnodeRepository {
  return new DappnodeRepository(
    gateways,
    new JsonRpcProvider(),
    { baseUrl: "https://mirror.example", timeoutMs: 1000, maxBytes: 1024 },
    () => false
  );
}

describe("IPFS directory listing", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  for (const version of [0, 1] as const) {
    it(`lists CIDv${version} directories when gateway codec conversion is disabled`, async () => {
      const cid = CID.create(version, dagPb.code, await sha256.digest(directoryBytes));
      const requests: string[] = [];
      globalThis.fetch = async (input, init) => {
        requests.push(input.toString());
        if (!input.toString().endsWith("?format=raw")) return new Response(null, { status: 406 });
        expect(new Headers(init?.headers).get("Accept")).to.equal("application/vnd.ipld.raw");
        return new Response(Buffer.from(directoryBytes));
      };

      const entries = await repository().list(`/ipfs/${cid}`);
      expect(requests).to.deep.equal([`http://ipfs.dappnode:8080/ipfs/${cid}?format=raw`]);
      expect(entries.map((entry) => ({ ...entry, cid: entry.cid.toString() }))).to.deep.equal([
        {
          type: "file",
          cid: fileCid.toString(),
          name: "dappnode_package.json",
          path: `${fileCid}/dappnode_package.json`,
          size: 123
        }
      ]);
    });
  }

  it("retries another gateway when the directory block does not match its CID", async () => {
    const cid = CID.createV0(await sha256.digest(directoryBytes));
    let requests = 0;
    globalThis.fetch = async () => {
      requests++;
      return new Response(requests === 1 ? "wrong block" : Buffer.from(directoryBytes));
    };
    const entries = await repository(["https://first.example", "https://second.example"]).list(cid.toString());
    expect(requests).to.equal(2);
    expect(entries[0].cid.toString()).to.equal(fileCid.toString());
  });

  it("rejects a malformed DAG-PB block even when its hash matches", async () => {
    const bytes = Uint8Array.from([255]);
    const cid = CID.createV0(await sha256.digest(bytes));
    globalThis.fetch = async () => new Response(Buffer.from(bytes));
    let error: unknown;
    try {
      await repository().list(cid.toString());
    } catch (err) {
      error = err;
    }
    expect(error).to.be.instanceOf(Error);
    expect((error as Error).message).to.include("All IPFS gateways failed");
  });
});
