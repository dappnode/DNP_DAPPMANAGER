// Ipfs
import { IpfsInstance } from "./types";
import { CID } from "ipfs-http-client";
import { CarReader } from "@ipld/car";
// Hash
import crypto from "crypto";
import mh from "multihashes";
import { sanitizeIpfsPath } from "./utils";

export interface ContentFromIpfsGateway {
  carReader: CarReader;
  carStream: AsyncIterable<Uint8Array>;
}

/** Get CarReader from IPFS gateway with dag.export endpoint */
export async function getContentFromGw(
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
