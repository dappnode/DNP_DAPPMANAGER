import assert from "node:assert/strict";
import { Interface, JsonRpcProvider, ZeroAddress, hexlify, toUtf8Bytes } from "ethers";
import { CarWriter } from "@ipld/car";
import * as dagPb from "@ipld/dag-pb";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import { DappnodeInstaller } from "../../../src/dappnodeInstaller.js";
import { packageInstall } from "../../../src/calls/packageInstall.js";
import sinon from "sinon";
import { VerifiedRegistryClient, normalizeReleaseCid, repositoryAbi, type VerifiedRpc } from "@dappnode/toolkit";

const name = "fixture.dnp.dappnode.eth";
const apm = new Interface(repositoryAbi);
const ens = new Interface(["function resolver(bytes32) view returns (address)"]);
const resolver = new Interface(["function addr(bytes32) view returns (address)"]);
const resolverAddress = "0x1111111111111111111111111111111111111111";
const repoAddress = "0x2222222222222222222222222222222222222222";

async function releaseFixture(manifestName = name, manifestVersion = "1.0.1") {
  const manifest = {
    name: manifestName,
    version: manifestVersion,
    type: "service",
    description: "Offline registry authorization fixture",
    license: "MIT",
    architectures: ["linux/amd64"]
  };
  const responses = new Map<string, Uint8Array>();
  const links: dagPb.PBLink[] = [];
  for (const [filename, text] of Object.entries({
    "dappnode_package.json": JSON.stringify(manifest),
    "docker-compose.yml": "services:\n  fixture:\n    image: fixture:1\n",
    [`${manifestName}_${manifestVersion}_linux-amd64.txz`]: "image fixture; never executed"
  })) {
    const data = toUtf8Bytes(text);
    const varint = (n: number): number[] => (n < 128 ? [n] : [(n & 127) | 128, ...varint(n >>> 7)]);
    const bytes = dagPb.encode({
      Data: Uint8Array.from([8, 2, 18, ...varint(data.length), ...data, 24, ...varint(data.length)]),
      Links: []
    });
    const cid = CID.createV0(await sha256.digest(bytes));
    links.push({ Name: filename, Hash: cid, Tsize: bytes.length });
    const { writer, out } = CarWriter.create([cid]);
    const collect = (async () => {
      const chunks = [];
      for await (const chunk of out) chunks.push(chunk);
      return Buffer.concat(chunks);
    })();
    await writer.put({ cid, bytes });
    await writer.close();
    responses.set(`/ipfs/${cid}?format=car`, await collect);
  }
  const bytes = dagPb.encode(dagPb.prepare({ Data: Uint8Array.from([8, 1]), Links: links }));
  const cid = CID.createV0(await sha256.digest(bytes));
  responses.set(`/ipfs/${normalizeReleaseCid(cid.toString())}?format=raw`, bytes);
  responses.set(`/ipfs/${cid}?format=raw`, bytes);
  let registryCid = cid.toString();
  let snapshots = 0;
  const rpc: VerifiedRpc = {
    async request(method, params) {
      if (method === "eth_chainId") return "0x1";
      if (method === "eth_getBlockByNumber") {
        snapshots++;
        return {
          hash: `0x${"ab".repeat(32)}`,
          stateRoot: `0x${"cd".repeat(32)}`,
          number: "0x123",
          timestamp: `0x${Math.floor(Date.now() / 1000 - 600).toString(16)}`
        };
      }
      assert.equal(method, "eth_call");
      const tx = params[0] as { to: string; data: string };
      if (tx.to === "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e")
        return ens.encodeFunctionResult("resolver", [resolverAddress]);
      if (tx.to === resolverAddress) return resolver.encodeFunctionResult("addr", [repoAddress]);
      const call = apm.parseTransaction({ data: tx.data })!;
      return apm.encodeFunctionResult(call.name, [[1, 0, 1], ZeroAddress, hexlify(toUtf8Bytes(registryCid))]);
    }
  };
  return {
    cid: cid.toString(),
    responses,
    rpc,
    snapshots: () => snapshots,
    changeCid: (next: string) => {
      registryCid = next;
    }
  };
}

describe("Installer registry authorization", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function fixture(manifestName = name, manifestVersion = "1.0.1") {
    const f = await releaseFixture(manifestName, manifestVersion);
    globalThis.fetch = async (input) => {
      const url = new URL(input.toString());
      const bytes = f.responses.get(url.pathname + url.search);
      assert(bytes, `Unexpected gateway request ${url}`);
      return new Response(Uint8Array.from(bytes).buffer);
    };
    const installer = new DappnodeInstaller(
      "https://gateway.example",
      new JsonRpcProvider("https://must-not-be-used.example"),
      new VerifiedRegistryClient(f.rpc)
    );
    return { ...f, installer };
  }

  it("authenticates manifests before dependency resolution and carries proof metadata into releases", async () => {
    const f = await fixture();
    const manifest = await f.installer.getManifestFromDir(name, "1.0.1");
    assert.equal(manifest.name, name);
    const release = await f.installer.getPkgRelease({ dnpNameOrHash: name, version: "1.0.1", trustedKeys: [] });
    assert.equal(release.registryVerification?.cid, normalizeReleaseCid(f.cid));
    assert.equal(release.signedSafe, false, "chain authorization does not forge a publisher signature");
    await f.installer.assertVerifiedReleases([release]);
    assert.equal(f.snapshots(), 3);
    f.changeCid("QmWkAVYJhpwqApRfK4SZ6e2Xt2Daamc8uBpM1oMLmQ6fw4");
    await assert.rejects(f.installer.assertVerifiedReleases([release]), /release name, version or CID differs/);
  });

  it("accepts registered direct CIDs and rejects unregistered direct CIDs", async () => {
    const f = await fixture();
    const release = await f.installer.getPkgRelease({ dnpNameOrHash: f.cid, trustedKeys: [] });
    assert.equal(release.registryVerification?.packageName, name);
    f.changeCid("QmWkAVYJhpwqApRfK4SZ6e2Xt2Daamc8uBpM1oMLmQ6fw4");
    await assert.rejects(f.installer.getManifestFromDir(name, f.cid), /no matching registry record/);
  });

  for (const [manifestName, version] of [
    ["other.dnp.dappnode.eth", "1.0.1"],
    [name, "1.0.2"]
  ]) {
    it(`rejects registry/manifest identity mismatch ${manifestName}@${version}`, async () => {
      const f = await fixture(manifestName, version);
      await assert.rejects(f.installer.getManifestFromDir(name, "1.0.1"), /mismatch|differs/);
    });
  }

  it("isolates parallel operations and shares a snapshot across multi-release resolution", async () => {
    const f = await fixture();
    await f.installer.getPkgsReleases({ [name]: "1.0.1" }, []);
    assert.equal(f.snapshots(), 1);
    await Promise.all([
      f.installer.getVersionAndIpfsHash({ dnpNameOrHash: name }),
      f.installer.getVersionAndIpfsHash({ dnpNameOrHash: name })
    ]);
    assert.equal(f.snapshots(), 3);
  });

  it("enforces the chain gate even when every legacy bypass option is enabled", async () => {
    const f = await fixture();
    const release = await f.installer.getPkgRelease({ dnpNameOrHash: name, version: "1.0.1", trustedKeys: [] });
    delete release.registryVerification;
    release.isCore = true; // Skip unrelated hardware probes in this route test.
    const resolved = sinon.stub(f.installer, "getReleasesResolved").resolves({
      releases: [release],
      state: { [name]: "1.0.1" },
      message: "fixture",
      alreadyUpdated: {},
      currentVersions: {}
    });
    const writes = sinon.spy(f.installer, "writeFileToFs");
    try {
      await assert.rejects(
        packageInstall(f.installer, {
          name,
          version: "1.0.1",
          options: { BYPASS_RESOLVER: true, BYPASS_CORE_RESTRICTION: true, BYPASS_SIGNED_RESTRICTION: true }
        }),
        /CHAIN VERIFICATION: unverified release/
      );
      assert.equal(writes.callCount, 0, "verification must fail before image downloads or Docker loading");
    } finally {
      resolved.restore();
      writes.restore();
    }
  });

  it("fails closed when the managed verifier was not configured", async () => {
    const installer = new DappnodeInstaller("https://unused.example", new JsonRpcProvider());
    await assert.rejects(
      installer.getVersionAndIpfsHash({ dnpNameOrHash: name }),
      /configure the managed light client/
    );
  });
});
