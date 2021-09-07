// IPFS
import { create, CID, IPFSHTTPClient } from "ipfs-http-client";
import { CarReader } from "@ipld/car";
import { Block } from "@ipld/car/reader";
import { unpack } from "ipfs-car/unpack";
// Node
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
// Hashes
import crypto from "crypto";
import mh from "multihashes";
// Utils
import { logs } from "../../../logs";
import params from "../../../params";

export class IpfsGateway {
  ipfs: IPFSHTTPClient;
  ipfsHost: string;
  /** Default IPFS timeout for all requests */
  timeout = 30 * 1000;

  /**
   * Full URL to an IPFS API
   */
  constructor(ipfsHost: string) {
    this.ipfs = create({
      url: ipfsHost,
      timeout: this.timeout
    });
    this.ipfsHost = ipfsHost;
  }

  // Connect the IPFS gateway to a peer
  public async connectToPeer(peer: string): Promise<void> {
    try {
      await this.ipfs.swarm.connect(peer);
    } catch (e) {
      throw Error(`Error connecting to peer: ${peer}. ${e}`);
    }
  }

  /** Resolves an ipfsPath to a CID */
  public async resolveCid(ipfsPath: string): Promise<CID> {
    try {
      const resolveResult = await this.ipfs.dag.resolve(ipfsPath);
      return resolveResult.cid;
    } catch (e) {
      throw Error(`Error retrieving CID from Ipfs path: ${ipfsPath}. ${e}`);
    }
  }

  /** Verifies the CID by downloading the content, hashing it and comparing it to the original */
  public async writePackageContentIfCidVerified(
    ipfsPath: string
  ): Promise<void> {
    // 1. Resolve CID
    const cid = await this.resolveCid(ipfsPath);
    // 2. Get CAR from IPFS gateway
    const carStream = await this.fetchDagExport(cid);
    // 3. Get CAR reader
    const carReader = await this.getCarReader(carStream);
    // 4. Get roots from CAR reader
    const carReaderRoots = await this.getCarReaderRoots(carReader);
    // 5. Get block
    const carReaderBlock = await this.getCarReaderBlock(
      carReader,
      carReaderRoots
    );
    // 6. Hash buffer from car
    const buffHashed = this.hashBuff(carReaderBlock.bytes);
    // 7. Hash original CID
    const originalCidHashed = this.fromIpfsToHashSha(cid.toString());
    // 8. Compare CIDs
    if (buffHashed !== originalCidHashed) throw Error("CIDs are not equal");
    // 9. Write content to disk
    return await this.writeFiles(carReader);
  }

  /** Write carReader content to disk */
  private async writeFiles(
    carReader: CarReader,
    packagesPath = params.REPO_DIR
  ): Promise<void> {
    try {
      for await (const file of unpack(carReader)) {
        if (file.type === "file") {
          try {
            const content = file.content();
            for await (const item of content) {
              const buff = Buffer.from(item);
              fs.writeFileSync(path.join(packagesPath, file.name), buff);
            }
          } catch (e) {
            throw Error(`Error writing file ${file.name} to disk. ${e}`);
          }
        } else if (file.type !== "directory")
          throw Error(`Unexpected type of file`);
      }
    } catch (e) {
      logs.error(`Error writing package data using IPFS remote. ${e}`);
      throw e;
    }
  }

  /** Get carReader from an async Iterable */
  private async getCarReader(
    carStream: AsyncIterable<Uint8Array>
  ): Promise<CarReader> {
    try {
      return await CarReader.fromIterable(carStream);
    } catch (e) {
      throw Error(
        `Error getting CarReader from AsyncIterable<uint8Array>. ${e}`
      );
    }
  }

  /** Get roots from a carReader */
  private async getCarReaderRoots(carReader: CarReader): Promise<CID[]> {
    try {
      return await carReader.getRoots();
    } catch (e) {
      throw Error(`Error getting CarReader roots. ${e}`);
    }
  }

  /** Get the first block by its cid */
  private async getCarReaderBlock(
    carReader: CarReader,
    roots: CID[]
  ): Promise<Block> {
    try {
      const block = await carReader.get(roots[0]);
      if (!block) throw Error(`Block is undefined in roots: ${roots}`);
      return block;
    } catch (e) {
      throw Error(`Error getting first block from . ${e}`);
    }
  }

  /** Hash the buffer and get the SHA256 result compatible with IPFS multihash */
  private hashBuff(buf: Uint8Array): string {
    return crypto.createHash("sha256").update(buf).digest("hex");
  }

  /** Convert IPFS multihash to sha2-256 hash string */
  private fromIpfsToHashSha(multihash: string, prefix = false): string {
    const uint = mh.decode(mh.fromB58String(multihash)).digest;
    const buf = Buffer.from(uint).toString("hex");
    return prefix ? "0x" : "" + buf;
  }

  /** Fetch dag/export from an IPFS gateway */
  private async fetchDagExport(cid: CID): Promise<AsyncIterable<Uint8Array>> {
    try {
      const url = `${this.ipfsHost}/api/v0/dag/export?arg=${cid.toString()}`;
      const res = await fetch(url, { method: "POST" });
      if (res.body === null) throw Error("Body response is null");
      return res.body as unknown as AsyncIterable<Uint8Array>;
    } catch (e) {
      throw Error(`Error getting content from cid: ${cid}. ${e}`);
    }
  }

  // ipfs.dag.export is not properly typed as an async function yet
  /* async fetchDagExport(cid: CID): Promise<AsyncIterable<Uint8Array>> {
      try {
        return await this.ipfs.dag.export(cid);
      } catch (e) {
        throw Error(`Error getting content from cid: ${cid}. ${e}`);
      }
    } */
}
