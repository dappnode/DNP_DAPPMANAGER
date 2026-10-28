import assert from "node:assert/strict";
import { Interface, ZeroAddress, hexlify, toUtf8Bytes } from "ethers";
import {
  VerifiedRegistryClient,
  normalizeReleaseCid,
  type VerifiedRpc
} from "../../src/repository/verifiedRegistry.js";
import { repositoryAbi } from "../../src/repository/params.js";

const name = "fixture.dnp.dappnode.eth";
const cid = "QmdZ9EWDmx6SB2bxvk7BStVka6JkjzMzpun1TAuDvzhLp9";
const ensAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const resolverAddress = "0x1111111111111111111111111111111111111111";
const repoAddress = "0x2222222222222222222222222222222222222222";
const ens = new Interface(["function resolver(bytes32) view returns (address)"]);
const resolver = new Interface(["function addr(bytes32) view returns (address)"]);
const apm = new Interface(repositoryAbi);
const now = 1800000000000;

function fixture() {
  const block = {
    hash: `0x${"ab".repeat(32)}`,
    stateRoot: `0x${"cd".repeat(32)}`,
    number: "0x123",
    timestamp: `0x${(now / 1000 - 600).toString(16)}`
  };
  const requests: Array<{ method: string; params: unknown[] }> = [];
  let failCalls = false;
  let version = [1, 0, 1];
  const rpc: VerifiedRpc = {
    async request(method, params) {
      requests.push({ method, params });
      if (method === "eth_chainId") return "0x1";
      if (method === "eth_getBlockByNumber") return block;
      assert.equal(method, "eth_call");
      assert.deepEqual(params[1], { blockHash: block.hash, requireCanonical: true });
      if (failCalls) throw new Error("Invalid account/storage/code proof");
      const tx = params[0] as { to: string; data: string };
      if (tx.to === ensAddress) return ens.encodeFunctionResult("resolver", [resolverAddress]);
      if (tx.to === resolverAddress) return resolver.encodeFunctionResult("addr", [repoAddress]);
      assert.equal(tx.to, repoAddress);
      const call = apm.parseTransaction({ data: tx.data })!;
      if (call.name === "getVersionsCount") return apm.encodeFunctionResult(call.name, [2]);
      return apm.encodeFunctionResult(call.name, [version, ZeroAddress, hexlify(toUtf8Bytes(`/ipfs/${cid}`))]);
    }
  };
  return {
    block,
    requests,
    rpc,
    client: new VerifiedRegistryClient(rpc, () => now),
    rejectProof: () => {
      failCalls = true;
    },
    wrongVersion: () => {
      version = [1, 0, 2];
    }
  };
}

describe("Verified registry resolution", () => {
  it("pins ENS resolution and APM reads to one verified finalized block", async () => {
    const f = fixture();
    const session = await f.client.begin();
    const release = await session.resolve(name, "1.0.1");
    assert.equal(release.cid, normalizeReleaseCid(cid));
    assert.equal(release.repositoryAddress, repoAddress);
    assert.equal(release.blockHash, f.block.hash);
    assert.equal(release.stateRoot, f.block.stateRoot);
    assert.deepEqual(
      f.requests.map(({ method }) => method),
      ["eth_chainId", "eth_getBlockByNumber", "eth_call", "eth_call", "eth_call"]
    );
    await session.resolve(name, "1.0.1");
    assert.equal(f.requests.length, 5);
    await (await f.client.begin()).resolve(name, "1.0.1");
    assert.equal(f.requests.length, 10, "repository addresses must be resolved again in the new snapshot");
  });

  it("uses the verified transport for historical version enumeration", async () => {
    const f = fixture();
    const versions = await (await f.client.begin()).versions(name);
    assert.deepEqual(
      versions.map((v) => v.versionId),
      [1, 2]
    );
    assert(versions.every((v) => v.contentUri === normalizeReleaseCid(cid)));
  });

  it("propagates rejected chain proofs without an ordinary-RPC fallback", async () => {
    const f = fixture();
    f.rejectProof();
    await assert.rejects((await f.client.begin()).resolve(name), /Invalid account\/storage\/code proof/);
    assert.equal(f.requests.filter((r) => r.method === "eth_call").length, 1);
  });

  it("rejects an APM record for a different semantic version", async () => {
    const f = fixture();
    f.wrongVersion();
    await assert.rejects((await f.client.begin()).resolve(name, "1.0.1"), /version mismatch/);
  });

  for (const seconds of [-61, 1801]) {
    it(`rejects a finalized timestamp with age ${seconds} seconds`, async () => {
      const f = fixture();
      f.block.timestamp = `0x${(now / 1000 - seconds).toString(16)}`;
      await assert.rejects(f.client.begin(), /stale/);
    });
  }

  it("rejects another chain, missing roots, and sessions that expire mid-operation", async () => {
    const f = fixture();
    await assert.rejects(new VerifiedRegistryClient({ request: async () => "0x64" }).begin(), /mainnet/);
    f.block.stateRoot = "0x";
    await assert.rejects(f.client.begin(), /no verified finalized block/);
    const g = fixture();
    let time = now;
    const session = await new VerifiedRegistryClient(g.rpc, () => time).begin();
    time += 31 * 60 * 1000;
    await assert.rejects(session.resolve(name), /stale/);
    assert.equal(g.requests.length, 2);
  });
});
