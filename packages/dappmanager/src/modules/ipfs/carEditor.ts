// Ipfs
import { IpfsInstance } from "./types";
import { unpack } from "ipfs-car/unpack";
import { CID } from "ipfs-http-client";
import { CarReader } from "@ipld/car";
// Utils
import params from "../../params";
// Hash
import crypto from "crypto";
import mh from "multihashes";
// Node
import fs from "fs";
import path from "path";

/** Get CarReader from IPFS gateway with dag.export endpoint */
export async function getContentFromIpfsGateway(
  ipfs: IpfsInstance,
  ipfsPath: string
): Promise<CarReader> {
  try {
    const cid = CID.parse(ipfsPath);
    const carStream = ipfs.dag.export(cid);
    const carReader = await CarReader.fromIterable(carStream);
    const carReaderRoots = await carReader.getRoots();
    const carReaderBlock = await carReader.get(carReaderRoots[0]);

    // Check block exists
    if (!carReaderBlock) throw Error(`Block does not exist`);

    // IMPORTANT! throw error if not verified content
    if (!isTrustedContent(carReaderBlock.bytes, cid))
      throw Error(`CIDs are not equal, content is not trusted.`);

    return carReader;
  } catch (e) {
    throw Error(`Error getting content package from ipfs gateway. ${e}`);
  }
}

/** Writes CarReader to the fs in a given path */
export async function writeCarReaderToFs(
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
    throw Error(`Error writing package data using IPFS remote. ${e}`);
  }
}

// Utils

/** Verifies the data contains the same hash has the original CID */
function isTrustedContent(buf: Uint8Array, originalCid: CID): boolean {
  function hashBuff(buf: Uint8Array): string {
    return crypto.createHash("sha256").update(buf).digest("hex");
  }
  function fromIpfsToHashSha(multihash: string, prefix = false): string {
    const uint = mh.decode(mh.fromB58String(multihash)).digest;
    const buf = Buffer.from(uint).toString("hex");
    return prefix ? "0x" : "" + buf;
  }

  return hashBuff(buf) === fromIpfsToHashSha(originalCid.toString());
}
