import { Interface, getAddress, namehash, ZeroAddress, Contract, toUtf8String } from "ethers";
import { parse, valid, validRange } from "semver";
import { CID } from "multiformats/cid";
import type { RegistryVerification } from "@dappnode/types";
import { repositoryAbi } from "./params.js";
import type { ApmVersionState } from "./types.js";

/** This transport must belong to the managed light client, never an upstream RPC. */
export interface VerifiedRpc {
  request(method: string, params: unknown[]): Promise<unknown>;
}

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const ens = new Interface(["function resolver(bytes32 node) view returns (address)"]);
const resolver = new Interface(["function addr(bytes32 node) view returns (address)"]);
const apm = new Interface(repositoryAbi);
const MAX_HEAD_AGE_SECONDS = 30 * 60;
const hex32 = /^0x[0-9a-fA-F]{64}$/;

export function normalizeReleaseCid(value: string): string {
  return CID.parse(value.replace(/^\/?ipfs\//, "").replace(/\/$/, ""))
    .toV1()
    .toString();
}

/** A session pins ENS and all APM calls to the same consensus-verified block hash. */
export class VerifiedRegistryClient {
  constructor(
    private readonly rpc: VerifiedRpc,
    private readonly now: () => number = Date.now
  ) {}

  async begin(): Promise<RegistrySession> {
    if ((await this.rpc.request("eth_chainId", [])) !== "0x1")
      throw new Error("CHAIN VERIFICATION: expected Ethereum mainnet");
    const block = (await this.rpc.request("eth_getBlockByNumber", ["finalized", false])) as {
      hash?: string;
      stateRoot?: string;
      number?: string;
      timestamp?: string;
    } | null;
    if (
      !block ||
      !hex32.test(block.hash ?? "") ||
      !hex32.test(block.stateRoot ?? "") ||
      !/^0x[0-9a-f]+$/i.test(block.number ?? "") ||
      !/^0x[0-9a-f]+$/i.test(block.timestamp ?? "")
    ) {
      throw new Error(
        "CHAIN VERIFICATION: no verified finalized block is available; check the light client and checkpoint"
      );
    }
    const snapshot = {
      chainId: 1 as const,
      blockHash: block.hash!,
      stateRoot: block.stateRoot!,
      blockNumber: Number(BigInt(block.number!)),
      blockTimestamp: Number(BigInt(block.timestamp!))
    };
    const session = new RegistrySession(this.rpc, snapshot, this.now);
    session.assertFresh();
    return session;
  }
}

type Snapshot = Pick<RegistryVerification, "chainId" | "blockHash" | "stateRoot" | "blockNumber" | "blockTimestamp">;

export class RegistrySession {
  private readonly repositories = new Map<string, Promise<string>>();
  private readonly releases = new Map<string, Promise<RegistryVerification>>();
  constructor(
    private readonly rpc: VerifiedRpc,
    readonly snapshot: Readonly<Snapshot>,
    private readonly now: () => number
  ) {}

  assertFresh(): void {
    const age = this.now() / 1000 - this.snapshot.blockTimestamp;
    if (
      !Number.isSafeInteger(this.snapshot.blockNumber) ||
      !Number.isSafeInteger(this.snapshot.blockTimestamp) ||
      age < -60 ||
      age > MAX_HEAD_AGE_SECONDS
    ) {
      throw new Error("CHAIN VERIFICATION: finalized block is stale; wait for the light client to sync");
    }
  }

  async call(to: string, data: string): Promise<string> {
    this.assertFresh();
    // No state overrides or unverified eth_call forwarding are permitted.
    const result = await this.rpc.request("eth_call", [
      { to: getAddress(to), data },
      {
        blockHash: this.snapshot.blockHash,
        requireCanonical: true
      }
    ]);
    this.assertFresh();
    if (typeof result !== "string" || !/^0x([0-9a-f]{2})*$/i.test(result))
      throw new Error("CHAIN VERIFICATION: invalid call result");
    return result;
  }

  async repository(name: string): Promise<string> {
    if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.dappnode\.eth$/.test(name))
      throw new Error(`Invalid registry package name ${name}`);
    let result = this.repositories.get(name);
    if (!result) {
      result = (async () => {
        const node = namehash(name);
        const [address] = ens.decodeFunctionResult(
          "resolver",
          await this.call(ENS_REGISTRY, ens.encodeFunctionData("resolver", [node]))
        );
        if (address === ZeroAddress) throw new Error(`Could not resolve ${name}: NOREPO`);
        const [repo] = resolver.decodeFunctionResult(
          "addr",
          await this.call(address, resolver.encodeFunctionData("addr", [node]))
        );
        if (repo === ZeroAddress) throw new Error(`Could not resolve ${name}: NOREPO`);
        return getAddress(repo);
      })();
      this.repositories.set(name, result);
    }
    return result;
  }

  async contract(name: string): Promise<Contract> {
    const address = await this.repository(name);
    return new Contract(address, repositoryAbi, {
      provider: null,
      call: async (tx) => this.call(String(tx.to), String(tx.data))
    });
  }

  async resolve(name: string, version = "*"): Promise<RegistryVerification> {
    this.assertFresh();
    if (version === "latest") version = "*";
    if (!validRange(version)) throw new Error(`Invalid registry version ${version}`);
    const key = `${name}@${version}`;
    let result = this.releases.get(key);
    if (!result) {
      const requestedVersion = version;
      result = (async () => {
        const repositoryAddress = await this.repository(name);
        const parsed = parse(requestedVersion);
        const method = valid(requestedVersion) ? "getBySemanticVersion" : "getLatest";
        const args = parsed ? [[parsed.major, parsed.minor, parsed.patch]] : [];
        const record = await this.readVersion(name, repositoryAddress, method, args);
        if (parsed && record.version !== `${parsed.major}.${parsed.minor}.${parsed.patch}`) {
          throw new Error(`CHAIN VERIFICATION: registry version mismatch for ${key}`);
        }
        return record;
      })();
      this.releases.set(key, result);
    }
    return result;
  }

  async versions(name: string, lastVersionId = 0): Promise<ApmVersionState[]> {
    const address = await this.repository(name);
    const [total] = apm.decodeFunctionResult(
      "getVersionsCount",
      await this.call(address, apm.encodeFunctionData("getVersionsCount"))
    );
    const count = Number(total);
    if (!Number.isSafeInteger(count) || count < 0 || count > 10000)
      throw new Error("CHAIN VERIFICATION: invalid registry version count");
    const start = Number.isSafeInteger(lastVersionId) && lastVersionId >= 0 ? lastVersionId + 1 : 1;
    const records: ApmVersionState[] = [];
    // Bound concurrent proof requests instead of issuing one RPC per historical version at once.
    for (let id = start; id <= count; id++) {
      const record = await this.readVersion(name, address, "getByVersionId", [id]);
      records.push({ versionId: id, version: record.version, contentUri: record.cid });
    }
    return records;
  }

  private async readVersion(
    name: string,
    repositoryAddress: string,
    method: string,
    args: unknown[]
  ): Promise<RegistryVerification> {
    const response = await this.call(repositoryAddress, apm.encodeFunctionData(method, args));
    const [numbers, , uri] = apm.decodeFunctionResult(method, response);
    const version = Array.from(numbers as bigint[], (part) => part.toString()).join(".");
    if (!valid(version)) throw new Error(`CHAIN VERIFICATION: invalid version for ${name}`);
    const contentUri = toUtf8String(uri);
    return { ...this.snapshot, packageName: name, version, cid: normalizeReleaseCid(contentUri), repositoryAddress };
  }
}
