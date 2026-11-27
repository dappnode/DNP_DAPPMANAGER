import { expect } from "chai";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonRpcProvider } from "ethers";
import { DappnodeRepository } from "../../src/repository/repository.js";
import { car, directory, FixtureFile, mockFetch, text, unixfsFile } from "./fixtures.js";
import type { CID } from "multiformats/cid";

const MIRROR = "https://mirror.example";
const GATEWAY = "https://primary.example";
const IMAGE = "test.dnp.dappnode.eth_1.0.0_linux-amd64.txz";
const MANIFEST = "dappnode_package.json";

interface Release {
  dirCid: CID;
  dirBytes: Uint8Array;
  image: FixtureFile;
  manifest: FixtureFile;
}

async function release(): Promise<Release> {
  const image = await unixfsFile(text("docker image bytes"));
  const manifest = await unixfsFile(text(JSON.stringify({ name: "test.dnp.dappnode.eth", version: "1.0.0" })), {
    chunkSize: 1024
  });
  const dir = await directory([
    { name: MANIFEST, cid: manifest.root, size: manifest.tsize },
    { name: IMAGE, cid: image.root, size: image.tsize }
  ]);
  return { dirCid: dir.cid, dirBytes: dir.bytes, image, manifest };
}

function mirrorListing(r: Release): string {
  return JSON.stringify([
    { name: MANIFEST, size: r.manifest.content.length },
    { name: IMAGE, size: r.image.content.length }
  ]);
}

function repository(isMirrorEnabled: () => boolean, logs: string[] = []): DappnodeRepository {
  return new DappnodeRepository(
    [GATEWAY],
    new JsonRpcProvider(),
    { baseUrl: MIRROR, timeoutMs: 1000, maxBytes: 1024 * 1024 },
    isMirrorEnabled,
    (level, message) => logs.push(`${level}: ${message}`),
    { sleep: async () => undefined }
  );
}

describe("Mirror to IPFS fallback", () => {
  const originalFetch = globalThis.fetch;
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "mirror-fallback-"));
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    await rm(dir, { recursive: true, force: true });
  });

  it("falls back to the image file CID when the mirror image download fails", async () => {
    const r = await release();
    const imageCar = await car([r.image.root], r.image.blocks);
    const requests = mockFetch({
      [`${MIRROR}/${r.dirCid}/${IMAGE}`]: () => new Response("boom", { status: 500 }),
      [`${GATEWAY}/ipfs/${r.dirCid}?format=raw`]: () => new Response(Buffer.from(r.dirBytes)),
      [`${GATEWAY}/ipfs/${r.image.root}?format=car`]: () => new Response(imageCar)
    });
    const logs: string[] = [];
    const path = join(dir, "image.txz");

    await repository(() => true, logs).writeFileToFs({
      // Mirror-listed images carry the release directory CID as a placeholder hash
      hash: r.dirCid.toString(),
      path,
      filename: IMAGE,
      packageHash: r.dirCid.toString()
    });

    expect(await readFile(path, "utf8")).to.equal("docker image bytes");
    expect(requests).to.include(`${GATEWAY}/ipfs/${r.image.root}?format=car`);
    expect(requests).to.not.include(`${GATEWAY}/ipfs/${r.dirCid}?format=car`);
    expect(logs.some((line) => line.startsWith("warn: Mirror download failed"))).to.equal(true);
  });

  it("resolves the image file CID when the mirror was disabled after listing", async () => {
    const r = await release();
    const imageCar = await car([r.image.root], r.image.blocks);
    const requests = mockFetch({
      [`${GATEWAY}/ipfs/${r.dirCid}?format=raw`]: () => new Response(Buffer.from(r.dirBytes)),
      [`${GATEWAY}/ipfs/${r.image.root}?format=car`]: () => new Response(imageCar)
    });
    const path = join(dir, "image.txz");

    await repository(() => false).writeFileToFs({
      hash: r.dirCid.toString(),
      path,
      filename: IMAGE,
      packageHash: r.dirCid.toString()
    });

    expect(await readFile(path, "utf8")).to.equal("docker image bytes");
    expect(requests.some((url) => url.startsWith(MIRROR))).to.equal(false);
  });

  it("falls back to IPFS for a small file when the mirror file download fails", async () => {
    const r = await release();
    const manifestCar = await car([r.manifest.root], r.manifest.blocks);
    const requests = mockFetch({
      [`${MIRROR}/${r.dirCid}/`]: () => new Response(mirrorListing(r)),
      [`${MIRROR}/${r.dirCid}/${MANIFEST}`]: () => new Response("gone", { status: 404 }),
      [`${GATEWAY}/ipfs/${r.dirCid}?format=raw`]: () => new Response(Buffer.from(r.dirBytes)),
      [`${GATEWAY}/ipfs/${r.manifest.root}?format=car`]: () => new Response(manifestCar)
    });

    const manifest = await repository(() => true).getManifestFromDir(r.dirCid.toString());

    expect(manifest).to.deep.equal({ name: "test.dnp.dappnode.eth", version: "1.0.0" });
    expect(requests).to.include(`${MIRROR}/${r.dirCid}/${MANIFEST}`);
    expect(requests).to.include(`${GATEWAY}/ipfs/${r.manifest.root}?format=car`);
  });

  it("falls back to IPFS for a small file when the mirror is disabled between listing and download", async () => {
    const r = await release();
    const manifestCar = await car([r.manifest.root], r.manifest.blocks);
    const requests = mockFetch({
      [`${MIRROR}/${r.dirCid}/`]: () => new Response(mirrorListing(r)),
      [`${GATEWAY}/ipfs/${r.dirCid}?format=raw`]: () => new Response(Buffer.from(r.dirBytes)),
      [`${GATEWAY}/ipfs/${r.manifest.root}?format=car`]: () => new Response(manifestCar)
    });
    let calls = 0;
    // Enabled for the listing, disabled afterwards
    const isMirrorEnabled = (): boolean => calls++ === 0;

    const manifest = await repository(isMirrorEnabled).getManifestFromDir(r.dirCid.toString());

    expect(manifest).to.deep.equal({ name: "test.dnp.dappnode.eth", version: "1.0.0" });
    expect(requests).to.include(`${MIRROR}/${r.dirCid}/`);
    expect(requests).to.not.include(`${MIRROR}/${r.dirCid}/${MANIFEST}`);
  });

  for (const [description, body] of [
    ["an object instead of an array", JSON.stringify({ files: [] })],
    ["entries without a numeric size", JSON.stringify([{ name: MANIFEST, size: "12" }])],
    ["invalid JSON", "<html>not json</html>"]
  ]) {
    it(`falls back to the IPFS listing when the mirror listing is ${description}`, async () => {
      const r = await release();
      const manifestCar = await car([r.manifest.root], r.manifest.blocks);
      mockFetch({
        [`${MIRROR}/${r.dirCid}/`]: () => new Response(body),
        [`${MIRROR}/${r.dirCid}/${MANIFEST}`]: () => new Response("mirror content must not be used", { status: 500 }),
        [`${GATEWAY}/ipfs/${r.dirCid}?format=raw`]: () => new Response(Buffer.from(r.dirBytes)),
        [`${GATEWAY}/ipfs/${r.manifest.root}?format=car`]: () => new Response(manifestCar)
      });
      const logs: string[] = [];

      const manifest = await repository(() => true, logs).getManifestFromDir(r.dirCid.toString());

      expect(manifest).to.deep.equal({ name: "test.dnp.dappnode.eth", version: "1.0.0" });
      expect(logs.some((line) => line.startsWith(`warn: Mirror listing of ${r.dirCid} failed`))).to.equal(true);
    });
  }

  it("streams a mirror image through a .part file and renames it on success", async () => {
    const r = await release();
    const requests = mockFetch({
      [`${MIRROR}/${r.dirCid}/${IMAGE}`]: () =>
        new Response("docker image bytes", { headers: { "content-length": "18" } })
    });
    const path = join(dir, "image.txz");
    const progress: number[] = [];

    await repository(() => true).writeFileToFs({
      hash: r.dirCid.toString(),
      path,
      progress: (n) => progress.push(n),
      filename: IMAGE,
      packageHash: r.dirCid.toString()
    });

    expect(await readFile(path, "utf8")).to.equal("docker image bytes");
    expect(requests).to.deep.equal([`${MIRROR}/${r.dirCid}/${IMAGE}`]);
    expect(progress[progress.length - 1]).to.equal(100);
    expect(await readdir(dir)).to.deep.equal(["image.txz"]);
  });

  it("rejects a relative destination path before downloading", async () => {
    const requests = mockFetch({});
    let error: unknown;
    try {
      await repository(() => false).writeFileToFs({
        hash: "QmdZ9EWDmx6SB2bxvk7BStVka6JkjzMzpun1TAuDvzhLp9",
        path: "image.txz"
      });
    } catch (e) {
      error = e;
    }
    expect((error as Error).message).to.include("Invalid path");
    expect(requests).to.deep.equal([]);
  });

  it("throws when pinning on the local IPFS node fails", async () => {
    mockFetch({});
    let error: unknown;
    try {
      await repository(() => false).pinAddLocal("QmdZ9EWDmx6SB2bxvk7BStVka6JkjzMzpun1TAuDvzhLp9");
    } catch (e) {
      error = e;
    }
    expect((error as Error).message).to.include("Error pinning");
  });
});
