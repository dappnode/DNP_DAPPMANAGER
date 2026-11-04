import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buffer } from "node:stream/consumers";
import { CarWriter } from "@ipld/car";
import * as dagPb from "@ipld/dag-pb";
import { JsonRpcProvider } from "ethers";
import { CID } from "multiformats/cid";
import * as raw from "multiformats/codecs/raw";
import { sha256, sha512 } from "multiformats/hashes/sha2";
import { DappnodeRepository } from "../../src/repository/repository.js";

interface FixtureBlock {
  cid: CID;
  bytes: Uint8Array;
}

async function nestedFile(version: 0 | 1, rawLeaves: boolean): Promise<FixtureBlock[]> {
  const block = async (bytes: Uint8Array, codec: number = dagPb.code): Promise<FixtureBlock> => ({
    cid: CID.create(codec === dagPb.code ? version : 1, codec, await sha256.digest(bytes)),
    bytes
  });
  const leaves = await Promise.all(
    ["veri", "fied"].map((text) => {
      const bytes = Buffer.from(text);
      if (rawLeaves) return block(bytes, raw.code);
      // UnixFS File with four inline bytes and filesize = 4.
      return block(dagPb.encode({ Data: Uint8Array.from([8, 2, 18, 4, ...bytes, 24, 4]), Links: [] }));
    })
  );
  const branches = await Promise.all(
    leaves.map((leaf) =>
      block(
        dagPb.encode({
          // UnixFS File with filesize = 4 and one four-byte child.
          Data: Uint8Array.from([8, 2, 24, 4, 32, 4]),
          Links: [{ Hash: leaf.cid, Tsize: leaf.bytes.length }]
        })
      )
    )
  );
  const root = await block(
    dagPb.encode({
      // UnixFS File with filesize = 8 and two four-byte children.
      Data: Uint8Array.from([8, 2, 24, 8, 32, 4, 32, 4]),
      Links: branches.map((branch, index) => ({
        Hash: branch.cid,
        Tsize: branch.bytes.length + leaves[index].bytes.length
      }))
    })
  );
  return [root, branches[0], leaves[0], branches[1], leaves[1]];
}

async function archive(blocks: FixtureBlock[]): Promise<Buffer> {
  const { writer, out } = CarWriter.create([blocks[0].cid]);
  const result = buffer(out);
  for (const block of blocks) await writer.put(block);
  await writer.close();
  return result;
}

function alterBlock(blocks: FixtureBlock[], index: number): FixtureBlock[] {
  return blocks.map((block, position) => {
    if (position !== index) return block;
    let bytes: Uint8Array;
    if (index === 0) {
      const node = dagPb.decode(block.bytes);
      bytes = dagPb.encode({ ...node, Links: [...node.Links].reverse() });
    } else if (index === 1) {
      const node = dagPb.decode(block.bytes);
      bytes = dagPb.encode({ ...node, Links: [{ ...node.Links[0], Hash: blocks[4].cid }] });
    } else if (block.cid.code === raw.code) {
      bytes = Uint8Array.from(block.bytes);
      bytes[0] ^= 1;
    } else {
      const node = dagPb.decode(block.bytes);
      const data = Uint8Array.from(node.Data!);
      data[4] ^= 1; // Change inline content while preserving the UnixFS metadata.
      bytes = dagPb.encode({ ...node, Data: data });
    }
    return { cid: block.cid, bytes };
  });
}

function client(): DappnodeRepository {
  return new DappnodeRepository(
    ["https://primary.example", "https://backup.example"],
    new JsonRpcProvider(),
    { baseUrl: "https://mirror.example", timeoutMs: 1000, maxBytes: 1024 },
    () => false
  );
}

describe("CAR block authentication", () => {
  const fetchBeforeTest = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = fetchBeforeTest;
  });

  for (const version of [0, 1] as const) {
    for (const rawLeaves of [false, true]) {
      const description = `CIDv${version} with ${rawLeaves ? "raw" : "DAG-PB"} leaves`;

      it(`reads an authentic nested file: ${description}`, async () => {
        const blocks = await nestedFile(version, rawLeaves);
        const body = await archive(blocks);
        globalThis.fetch = async () => new Response(body);

        assert.equal(await client().writeFileToMemory(blocks[0].cid.toString()), "verified");
      });

      for (const [index, location] of ["root", "intermediate node", "leaf"].entries()) {
        it(`rejects modified ${location} bytes under the original CID: ${description}`, async () => {
          const blocks = await nestedFile(version, rawLeaves);
          const body = await archive(alterBlock(blocks, index));
          globalThis.fetch = async () => new Response(body);

          await assert.rejects(
            client().writeFileToBytes(blocks[0].cid.toString()),
            /IPFS block integrity check failed/
          );
        });
      }
    }
  }

  it("discards a corrupted response before returning content from the backup gateway", async () => {
    const blocks = await nestedFile(1, true);
    const badResponse = await archive(alterBlock(blocks, 4));
    const goodResponse = await archive(blocks);
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(input.toString());
      return new Response(requests.length === 1 ? badResponse : goodResponse);
    };

    const cid = blocks[0].cid.toString();
    assert.equal(await client().writeFileToMemory(cid), "verified");
    assert.deepEqual(requests, [
      `https://primary.example/ipfs/${cid}?format=car`,
      `https://backup.example/ipfs/${cid}?format=car`
    ]);
  });

  it("leaves the destination untouched when a late file chunk fails verification", async () => {
    const blocks = await nestedFile(0, true);
    const body = await archive(alterBlock(blocks, 4));
    globalThis.fetch = async () => new Response(body);
    const directory = await mkdtemp(join(tmpdir(), "ipfs-block-auth-"));
    const path = join(directory, "package.txz");
    try {
      await writeFile(path, "previous download");

      await assert.rejects(
        client().writeFileToFs({ hash: blocks[0].cid.toString(), path }),
        /IPFS block integrity check failed/
      );
      assert.equal(await readFile(path, "utf8"), "previous download");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects a block whose hash algorithm is unsupported", async () => {
    const blocks = await nestedFile(1, false);
    const bytes = blocks[0].bytes;
    const cid = CID.createV1(dagPb.code, await sha512.digest(bytes));
    const body = await archive([{ cid, bytes }, ...blocks.slice(1)]);
    globalThis.fetch = async () => new Response(body);

    await assert.rejects(client().writeFileToBytes(cid.toString()), /Unsupported IPFS block hash/);
  });
});
