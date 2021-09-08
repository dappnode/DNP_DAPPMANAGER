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

  /** Resolves an ipfsPath to a CID */
  public async resolveCid(ipfsPath: string): Promise<CID> {
    try {
      const resolveResult = await this.ipfs.dag.resolve(ipfsPath);
      return resolveResult.cid;
    } catch (e) {
      throw Error(`Error retrieving CID from Ipfs path: ${ipfsPath}. ${e}`);
    }
  }

  /** Get carReader from an async Iterable */
  public async getCarReader(cid: CID): Promise<CarReader> {
    try {
      const carStream = await this.fetchDagExport(cid);
      return await CarReader.fromIterable(carStream);
    } catch (e) {
      throw Error(
        `Error getting CarReader from AsyncIterable<uint8Array>. ${e}`
      );
    }
  }

  /** Get roots from a carReader */
  public async getCarReaderRoots(carReader: CarReader): Promise<CID[]> {
    try {
      return await carReader.getRoots();
    } catch (e) {
      throw Error(`Error getting CarReader roots. ${e}`);
    }
  }

  /** Get the first block by its cid */
  public async getCarReaderBlock(
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

export class IpfsContentFromGateway {
  cid: CID;
  carReader: CarReader;
  carReaderRoots: CID[];
  carReaderBlock: Block;
  isVerified: boolean;

  constructor(
    cid: CID,
    carReader: CarReader,
    carReaderRoots: CID[],
    carReaderBlock: Block
  ) {
    this.cid = cid;
    this.carReader = carReader;
    this.carReaderRoots = carReaderRoots;
    this.carReaderBlock = carReaderBlock;
    this.isVerified = this.isContentVerified();
  }

  /** Write carReader content to disk */
  public async writeFiles(packagesPath = params.REPO_DIR): Promise<void> {
    try {
      for await (const file of unpack(this.carReader)) {
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

  /** Returns if the content was verified */
  private isContentVerified(): boolean {
    return (
      this.hashBuff(this.carReaderBlock.bytes) ===
      this.fromIpfsToHashSha(this.cid.toString())
    );
  }

  /** Hashes the buffer and get the SHA256 result compatible with IPFS multihash */
  private hashBuff(buf: Uint8Array): string {
    return crypto.createHash("sha256").update(buf).digest("hex");
  }

  /** Convert IPFS multihash to sha2-256 hash string */
  private fromIpfsToHashSha(multihash: string, prefix = false): string {
    const uint = mh.decode(mh.fromB58String(multihash)).digest;
    const buf = Buffer.from(uint).toString("hex");
    return prefix ? "0x" : "" + buf;
  }
}
