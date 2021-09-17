// Ipfs
import { IpfsInstance, IpfsCatOptions } from "./types";
import { CID } from "ipfs-http-client";
import { CarReader } from "@ipld/car";
// Hash
import crypto from "crypto";
import mh from "multihashes";
import { unpack } from "ipfs-car/unpack";

export interface ContentFromIpfsGateway {
  carReader: CarReader;
  carStream: AsyncIterable<Uint8Array>;
}

/** Get CarReader from IPFS gateway with dag.export endpoint */
export async function getContentFromIpfsGateway(
  ipfs: IpfsInstance,
  ipfsPath: string
): Promise<ContentFromIpfsGateway> {
  try {
    const cid = CID.parse(sanitizeIpfsPath(ipfsPath));
    const carStream = ipfs.dag.export(cid);
    const carReader = await CarReader.fromIterable(carStream);
    const carReaderRoots = await carReader.getRoots();
    const carReaderBlock = await carReader.get(carReaderRoots[0]);

    // Check block exists
    if (!carReaderBlock) throw Error(`Block does not exist`);

    // IMPORTANT! throw error if not verified content
    if (!isTrustedContent(carReaderBlock.bytes, cid))
      throw Error(`CIDs are not equal, content is not trusted.`);

    return { carReader, carStream };
  } catch (e) {
    throw Error(`Error getting content package from ipfs gateway. ${e}`);
  }
}

/**
 * Keeps a CarReader in memory
 * @param ipfsPath "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 * @returns hash contents as a buffer
 */
export async function catCarReaderToMemory(
  ipfs: IpfsInstance,
  ipfsPath: string,
  opts?: IpfsCatOptions
): Promise<Buffer> {
  const chunks = [];
  try {
    const content = await getContentFromIpfsGateway(ipfs, ipfsPath);
    for await (const unixFsEntry of unpack(content.carReader)) {
      try {
        const content = unixFsEntry.content();
        for await (const chunk of content) {
          chunks.push(chunk);
        }
      } catch (e) {
        throw Error(`Error getting chunk from file ${unixFsEntry.name}. ${e}`);
      }
    }
  } catch (e) {
    throw Error(`Error getting carReaderToMemory from ${ipfsPath}. ${e}`);
  }

  const data = Buffer.concat(chunks);
  if (opts?.maxLength && data.length >= opts.maxLength)
    throw Error(`Maximum size ${opts.maxLength} bytes exceeded`);

  return data;
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

/** Receives an ipfs path and returns it without the /ipfs/
 * @ipfsPath /ipfs/QmXiTSZNtahKFvwTsBmiXAXmwGhaXtYx1LyyP6QHKfXEWH
 * @returns QmXiTSZNtahKFvwTsBmiXAXmwGhaXtYx1LyyP6QHKfXEWH
 */
function sanitizeIpfsPath(ipfsPath: string): string {
  if (ipfsPath.includes("ipfs")) {
    return ipfsPath.replace("/ipfs/", "");
  }
  return ipfsPath;
}
