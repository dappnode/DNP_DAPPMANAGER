import CID from "cids";
import multicodec from "multicodec";
import { Content } from "../types";
import { isEmpty } from "./isEmpty";
const multihash: Multihash = require("multihashes");

/**
 * Used in the CONTENTHASH_INTERFACE_ID = "0xbc1c58d1"
 * @param contenthash
 * @returns content
 */
export function decodeContentHash(contenthash: string): Content {
  if (isEmpty(contenthash)) throw TypeError(`Empty content hash`);

  const contentHashEncoded = Buffer.from(contenthash.slice(2), "hex");
  const contentCodec = multicodec.getCodec(contentHashEncoded);

  if (contentCodec.startsWith("ipfs")) {
    const value = multicodec.rmPrefix(contentHashEncoded);
    const cid = new CID(value as Buffer);
    return {
      location: "ipfs",
      hash: multihash.toB58String(cid.multihash)
    };
  } else if (contentCodec.startsWith("swarm")) {
    const value = multicodec.rmPrefix(contentHashEncoded);
    const cid = new CID(value as Buffer);
    return {
      location: "swarm",
      hash: multihash.decode(cid.multihash).digest.toString("hex")
    };
  } else {
    throw Error(`Unsupported coded: ${contentCodec}`);
  }
}

/**
 * multihashes is not typed, nor @types/multihashes exists
 */
interface Multihash {
  /**
   * Convert the given multihash to a base58 encoded string.
   * @param hash
   * @returns
   */
  toB58String(hash: Buffer): string;

  /**
   * Decode a hash from the given multihash.
   * @param buf
   * @returns result
   */
  decode(
    buf: Buffer
  ): {
    code: number;
    name: string;
    length: number;
    digest: Buffer;
  };
}
