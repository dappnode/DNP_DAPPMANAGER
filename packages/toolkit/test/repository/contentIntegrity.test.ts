import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CarWriter } from "@ipld/car";
import * as dagPb from "@ipld/dag-pb";
import { JsonRpcProvider, Wallet } from "ethers";
import { CID } from "multiformats/cid";
import * as raw from "multiformats/codecs/raw";
import { sha256, sha512 } from "multiformats/hashes/sha2";
import { DappnodeRepository } from "../../src/repository/repository.js";
import { serializeIpfsDirectory } from "../../src/repository/releaseSignature.js";

type Block = { cid: CID; bytes: Uint8Array };

function varint(value: number): number[] {
  const bytes: number[] = [];
  while (value >= 128) {
    bytes.push((value & 127) | 128);
    value >>>= 7;
  }
  return [...bytes, value];
}

async function fileBlock(text: string, version: 0 | 1 = 0): Promise<Block> {
  const data = new TextEncoder().encode(text);
  // UnixFS protobuf: type = File, inline data, filesize.
  const bytes = dagPb.encode({
    Data: Uint8Array.from([8, 2, 18, ...varint(data.length), ...data, 24, ...varint(data.length)]),
    Links: []
  });
  return { cid: CID.create(version, dagPb.code, await sha256.digest(bytes)), bytes };
}

async function chunkedFile(rawLeaves: boolean): Promise<{ root: Block; children: Block[]; text: string }> {
  const texts = ["first chunk", "second chunk"];
  const children = await Promise.all(
    texts.map(async (text) => {
      if (!rawLeaves) return fileBlock(text);
      const bytes = new TextEncoder().encode(text);
      return { cid: CID.createV1(raw.code, await sha256.digest(bytes)), bytes };
    })
  );
  const bytes = dagPb.encode({
    // UnixFS protobuf: type = File, filesize, repeated child block sizes.
    Data: Uint8Array.from([8, 2, 24, ...varint(texts.join("").length), ...texts.flatMap((text) => [32, text.length])]),
    Links: children.map(({ cid, bytes }) => ({ Hash: cid, Tsize: bytes.length }))
  });
  return { root: { cid: CID.createV0(await sha256.digest(bytes)), bytes }, children, text: texts.join("") };
}

async function car(roots: CID[], blocks: Block[]): Promise<ArrayBuffer> {
  const { writer, out } = CarWriter.create(roots);
  const collected = (async () => {
    const chunks: Uint8Array[] = [];
    for await (const chunk of out) chunks.push(chunk);
    return Uint8Array.from(Buffer.concat(chunks)).buffer;
  })();
  for (const block of blocks) await writer.put(block);
  await writer.close();
  return collected;
}

function repository(gateways = ["https://first.example"], mirrorEnabled = false): DappnodeRepository {
  return new DappnodeRepository(
    gateways,
    new JsonRpcProvider(),
    { baseUrl: "https://mirror.example", timeoutMs: 1000, maxBytes: 1024 * 1024 },
    () => mirrorEnabled
  );
}

describe("IPFS downloaded content integrity", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  for (const version of [0, 1] as const) {
    it(`accepts a file whose bytes match its CIDv${version}`, async () => {
      const block = await fileBlock("expected fixture", version);
      const response = await car([block.cid], [block]);
      globalThis.fetch = async () => new Response(response);

      assert.equal(await repository().writeFileToMemory(block.cid.toString()), "expected fixture");
    });

    it(`rejects substituted root bytes under the expected CIDv${version}`, async () => {
      const expected = await fileBlock("expected fixture", version);
      const changed = await fileBlock("modified fixture", version);
      const response = await car([expected.cid], [{ cid: expected.cid, bytes: changed.bytes }]);
      globalThis.fetch = async () => new Response(response);

      await assert.rejects(repository().writeFileToBytes(expected.cid.toString()), /UNTRUSTED CONTENT:.*block/);
    });
  }

  for (const rawLeaves of [false, true]) {
    const leafType = rawLeaves ? "raw" : "DAG-PB";

    it(`accepts a chunked file with valid ${leafType} blocks`, async () => {
      const { root, children, text } = await chunkedFile(rawLeaves);
      const response = await car([root.cid], [root, ...children]);
      globalThis.fetch = async () => new Response(response);

      assert.equal(await repository().writeFileToMemory(root.cid.toString()), text);
    });

    it(`rejects a substituted ${leafType} child even when the root block is authentic`, async () => {
      const { root, children } = await chunkedFile(rawLeaves);
      const changed = children.map((block, index) => {
        const bytes = block.bytes.slice();
        if (index === children.length - 1) bytes[bytes.length - 1] ^= 1;
        return { cid: block.cid, bytes };
      });
      const response = await car([root.cid], [root, ...changed]);
      globalThis.fetch = async () => new Response(response);

      await assert.rejects(repository().writeFileToBytes(root.cid.toString()), /UNTRUSTED CONTENT:.*block/);
    });
  }

  it("rejects unsupported block hash algorithms", async () => {
    const { bytes } = await fileBlock("expected fixture");
    const cid = CID.createV1(dagPb.code, await sha512.digest(bytes));
    const response = await car([cid], [{ cid, bytes }]);
    globalThis.fetch = async () => new Response(response);

    await assert.rejects(repository().writeFileToBytes(cid.toString()), /Unsupported IPFS block hash/);
  });

  it("retries the next gateway after detecting a corrupted child block", async () => {
    const { root, children, text } = await chunkedFile(true);
    const authentic = await car([root.cid], [root, ...children]);
    const changedBytes = children[1].bytes.slice();
    changedBytes[changedBytes.length - 1] ^= 1;
    const corrupted = await car([root.cid], [root, children[0], { cid: children[1].cid, bytes: changedBytes }]);
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(input.toString());
      return new Response(requests.length === 1 ? corrupted : authentic);
    };

    const result = await repository(["https://first.example", "https://second.example"]).writeFileToMemory(
      root.cid.toString()
    );

    assert.equal(result, text);
    assert.deepEqual(requests, [
      `https://first.example/ipfs/${root.cid}?format=car`,
      `https://second.example/ipfs/${root.cid}?format=car`
    ]);
  });

  it("rejects an incomplete CAR", async () => {
    const { root, children } = await chunkedFile(true);
    const response = await car([root.cid], [root, children[0]]);
    globalThis.fetch = async () => new Response(response);

    await assert.rejects(repository().writeFileToBytes(root.cid.toString()), /Could not get block/);
  });

  it("rejects a CAR for a different root", async () => {
    const expected = await fileBlock("expected fixture");
    const changed = await fileBlock("modified fixture");
    const response = await car([changed.cid], [changed]);
    globalThis.fetch = async () => new Response(response);

    await assert.rejects(repository().writeFileToBytes(expected.cid.toString()), /UNTRUSTED CONTENT: expected root/);
  });

  it("does not create or overwrite a file when downloaded bytes do not match the hash", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "dappnode-content-integrity-"));
    try {
      const expected = await fileBlock("expected fixture");
      const changed = await fileBlock("modified fixture");
      const response = await car([expected.cid], [{ cid: expected.cid, bytes: changed.bytes }]);
      globalThis.fetch = async () => new Response(response);
      const existing = path.join(directory, "existing.txz");
      const missing = path.join(directory, "missing.txz");
      await fs.writeFile(existing, "original file");

      for (const destination of [existing, missing]) {
        await assert.rejects(
          repository().writeFileToFs({ hash: expected.cid.toString(), path: destination }),
          /UNTRUSTED CONTENT:.*block/
        );
      }
      assert.equal(await fs.readFile(existing, "utf8"), "original file");
      await assert.rejects(fs.stat(missing), { code: "ENOENT" });
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it("revalidates cached CARs and replaces poisoned extracted images", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "dappnode-car-cache-"));
    try {
      const expected = await fileBlock("verified image");
      const changed = await fileBlock("changed image!");
      const authentic = await car([expected.cid], [expected]);
      let downloads = 0;
      globalThis.fetch = async () => {
        downloads++;
        return new Response(authentic);
      };
      const destination = path.join(directory, "image.txz");
      const args = { hash: expected.cid.toString(), path: destination };
      await repository().writeFileToFs(args);
      await fs.writeFile(destination, "poisoned cached archive");
      await repository().writeFileToFs(args);
      assert.equal(await fs.readFile(destination, "utf8"), "verified image");
      assert.equal(downloads, 1);

      await fs.writeFile(
        `${destination}.car`,
        Buffer.from(await car([expected.cid], [{ cid: expected.cid, bytes: changed.bytes }]))
      );
      await repository().writeFileToFs(args);
      assert.equal(await fs.readFile(destination, "utf8"), "verified image");
      assert.equal(downloads, 2);
      assert.deepEqual((await fs.readdir(directory)).sort(), ["image.txz", "image.txz.car"]);
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it("retries corrupt image CARs and never uses a plain mirror even when enabled", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "dappnode-image-retry-"));
    try {
      const expected = await fileBlock("verified image");
      const changed = await fileBlock("modified image");
      const corrupt = await car([expected.cid], [{ cid: expected.cid, bytes: changed.bytes }]);
      const authentic = await car([expected.cid], [expected]);
      const requests: string[] = [];
      globalThis.fetch = async (input) => {
        requests.push(input.toString());
        assert(!input.toString().includes("mirror.example"));
        return new Response(requests.length === 1 ? corrupt : authentic);
      };
      const destination = path.join(directory, "image.txz");
      await repository(["https://first.example", "https://second.example"], true).writeFileToFs({
        hash: expected.cid.toString(),
        path: destination,
        filename: "image.txz",
        packageHash: expected.cid.toString()
      });
      assert.equal(requests.length, 2);
      assert.equal(await fs.readFile(destination, "utf8"), "verified image");
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects a tampered compose file even when the directory and release signature are authentic", async () => {
    const name = "fixture.public.dappnode.eth";
    const version = "1.0.1";
    const files = new Map<string, Block>([
      ["dappnode_package.json", await fileBlock(JSON.stringify({ name, version, type: "service" }))],
      ["docker-compose.yml", await fileBlock("services:\n  fixture:\n    image: fixture:1\n")],
      [`${name}_${version}_linux-amd64.txz`, await fileBlock("image fixture; never executed")]
    ]);
    const entries = () =>
      [...files].map(([name, { cid, bytes }]) => ({
        name,
        cid,
        size: bytes.length,
        type: "file" as const,
        path: `${cid}`
      }));
    const signer = Wallet.createRandom();
    const cidFormat = { version: 0, base: "base58btc" } as const;
    const signature = await signer.signMessage(serializeIpfsDirectory(entries(), cidFormat));
    files.set(
      "signature.json",
      await fileBlock(JSON.stringify({ signature, signature_protocol: "ECDSA_256", cid: cidFormat }))
    );
    const directoryBytes = dagPb.encode(
      dagPb.prepare({
        Data: Uint8Array.from([8, 1]), // UnixFS directory.
        Links: entries().map(({ name, cid, size }) => ({ Name: name, Hash: cid, Tsize: size }))
      })
    );
    const directoryCid = CID.createV0(await sha256.digest(directoryBytes));
    const responses = new Map<string, ArrayBuffer>([
      [`/ipfs/${directoryCid}?format=raw`, Uint8Array.from(directoryBytes).buffer]
    ]);
    for (const block of files.values()) responses.set(`/ipfs/${block.cid}?format=car`, await car([block.cid], [block]));
    globalThis.fetch = async (input) => {
      const url = new URL(input.toString());
      const bytes = responses.get(url.pathname + url.search);
      assert(bytes, `Unexpected request: ${url}`);
      return new Response(bytes);
    };
    const request = {
      dnpNameOrHash: directoryCid.toString(),
      trustedKeys: [
        {
          name: "Fixture signer",
          dnpNameSuffix: ".public.dappnode.eth",
          signatureProtocol: "ECDSA_256" as const,
          key: signer.address
        }
      ]
    };

    assert.equal((await repository().getPkgRelease(request)).signedSafe, true);

    const compose = files.get("docker-compose.yml")!;
    const changed = await fileBlock("services:\n  fixture:\n    image: fixture:1\n    privileged: true\n");
    responses.set(
      `/ipfs/${compose.cid}?format=car`,
      await car([compose.cid], [{ cid: compose.cid, bytes: changed.bytes }])
    );

    await assert.rejects(repository().getPkgRelease(request), /UNTRUSTED CONTENT:.*block/);
  });
});
